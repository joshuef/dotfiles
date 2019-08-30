(function() {
  var AFTERPROPS, AutoIndent, BRACE_CLOSE, BRACE_OPEN, CompositeDisposable, DidInsertText, File, JSXBRACE_CLOSE, JSXBRACE_OPEN, JSXTAG_CLOSE, JSXTAG_CLOSE_ATTRS, JSXTAG_OPEN, JSXTAG_SELFCLOSE_END, JSXTAG_SELFCLOSE_START, JS_ELSE, JS_IF, JS_RETURN, LINEALIGNED, NO_TOKEN, PAREN_CLOSE, PAREN_OPEN, PROPSALIGNED, Point, Range, SWITCH_BRACE_CLOSE, SWITCH_BRACE_OPEN, SWITCH_CASE, SWITCH_DEFAULT, TAGALIGNED, TEMPLATE_END, TEMPLATE_START, TERNARY_ELSE, TERNARY_IF, YAML, autoCompleteJSX, fs, path, ref, stripJsonComments,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, File = ref.File, Range = ref.Range, Point = ref.Point;

  fs = require('fs-plus');

  path = require('path');

  autoCompleteJSX = require('./auto-complete-jsx');

  DidInsertText = require('./did-insert-text');

  stripJsonComments = require('strip-json-comments');

  YAML = require('js-yaml');

  NO_TOKEN = 0;

  JSXTAG_SELFCLOSE_START = 1;

  JSXTAG_SELFCLOSE_END = 2;

  JSXTAG_OPEN = 3;

  JSXTAG_CLOSE_ATTRS = 4;

  JSXTAG_CLOSE = 5;

  JSXBRACE_OPEN = 6;

  JSXBRACE_CLOSE = 7;

  BRACE_OPEN = 8;

  BRACE_CLOSE = 9;

  TERNARY_IF = 10;

  TERNARY_ELSE = 11;

  JS_IF = 12;

  JS_ELSE = 13;

  SWITCH_BRACE_OPEN = 14;

  SWITCH_BRACE_CLOSE = 15;

  SWITCH_CASE = 16;

  SWITCH_DEFAULT = 17;

  JS_RETURN = 18;

  PAREN_OPEN = 19;

  PAREN_CLOSE = 20;

  TEMPLATE_START = 21;

  TEMPLATE_END = 22;

  TAGALIGNED = 'tag-aligned';

  LINEALIGNED = 'line-aligned';

  AFTERPROPS = 'after-props';

  PROPSALIGNED = 'props-aligned';

  module.exports = AutoIndent = (function() {
    function AutoIndent(editor) {
      this.editor = editor;
      this.onMouseUp = bind(this.onMouseUp, this);
      this.onMouseDown = bind(this.onMouseDown, this);
      this.handleOnDidStopChanging = bind(this.handleOnDidStopChanging, this);
      this.changedCursorPosition = bind(this.changedCursorPosition, this);
      this.DidInsertText = new DidInsertText(this.editor);
      this.autoJsx = atom.config.get('language-babel').autoIndentJSX;
      this.JSXREGEXP = /(<)([$_A-Za-z](?:[$_.:\-A-Za-z0-9])*)|(\/>)|(<\/)([$_A-Za-z](?:[$._:\-A-Za-z0-9])*)(>)|(>)|({)|(})|(\?)|(:)|(if)|(else)|(case)|(default)|(return)|(\()|(\))|(`)/g;
      this.mouseUp = true;
      this.multipleCursorTrigger = 1;
      this.disposables = new CompositeDisposable();
      this.eslintIndentOptions = this.getIndentOptions();
      this.templateDepth = 0;
      this.disposables.add(atom.config.observe('language-babel.autoIndentJSX', (function(_this) {
        return function(value) {
          return _this.autoJsx = value;
        };
      })(this)));
      this.disposables.add(atom.commands.add('atom-text-editor', {
        'language-babel:auto-indent-jsx-on': (function(_this) {
          return function(event) {
            _this.autoJsx = true;
            return _this.eslintIndentOptions = _this.getIndentOptions();
          };
        })(this)
      }));
      this.disposables.add(atom.commands.add('atom-text-editor', {
        'language-babel:auto-indent-jsx-off': (function(_this) {
          return function(event) {
            return _this.autoJsx = false;
          };
        })(this)
      }));
      this.disposables.add(atom.commands.add('atom-text-editor', {
        'language-babel:toggle-auto-indent-jsx': (function(_this) {
          return function(event) {
            _this.autoJsx = !_this.autoJsx;
            if (_this.autoJsx) {
              return _this.eslintIndentOptions = _this.getIndentOptions();
            }
          };
        })(this)
      }));
      document.addEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mouseup', this.onMouseUp);
      this.disposables.add(this.editor.onDidChangeCursorPosition((function(_this) {
        return function(event) {
          return _this.changedCursorPosition(event);
        };
      })(this)));
      this.handleOnDidStopChanging();
    }

    AutoIndent.prototype.destroy = function() {
      this.disposables.dispose();
      this.onDidStopChangingHandler.dispose();
      document.removeEventListener('mousedown', this.onMouseDown);
      return document.removeEventListener('mouseup', this.onMouseUp);
    };

    AutoIndent.prototype.changedCursorPosition = function(event) {
      var blankLineEndPos, bufferRow, columnToMoveTo, cursorPosition, cursorPositions, endPointOfJsx, j, len, previousRow, ref1, ref2, startPointOfJsx;
      if (!this.autoJsx) {
        return;
      }
      if (!this.mouseUp) {
        return;
      }
      if (event.oldBufferPosition.row === event.newBufferPosition.row) {
        return;
      }
      bufferRow = event.newBufferPosition.row;
      if (this.editor.hasMultipleCursors()) {
        cursorPositions = this.editor.getCursorBufferPositions();
        if (cursorPositions.length === this.multipleCursorTrigger) {
          this.multipleCursorTrigger = 1;
          bufferRow = 0;
          for (j = 0, len = cursorPositions.length; j < len; j++) {
            cursorPosition = cursorPositions[j];
            if (cursorPosition.row > bufferRow) {
              bufferRow = cursorPosition.row;
            }
          }
        } else {
          this.multipleCursorTrigger++;
          return;
        }
      } else {
        cursorPosition = event.newBufferPosition;
      }
      previousRow = event.oldBufferPosition.row;
      if (this.jsxInScope(previousRow)) {
        blankLineEndPos = (ref1 = /^\s*$/.exec(this.editor.lineTextForBufferRow(previousRow))) != null ? ref1[0].length : void 0;
        if (blankLineEndPos != null) {
          this.indentRow({
            row: previousRow,
            blockIndent: 0
          });
        }
      }
      if (!this.jsxInScope(bufferRow)) {
        return;
      }
      endPointOfJsx = new Point(bufferRow, 0);
      startPointOfJsx = autoCompleteJSX.getStartOfJSX(this.editor, cursorPosition);
      this.indentJSX(new Range(startPointOfJsx, endPointOfJsx));
      columnToMoveTo = (ref2 = /^\s*$/.exec(this.editor.lineTextForBufferRow(bufferRow))) != null ? ref2[0].length : void 0;
      if (columnToMoveTo != null) {
        return this.editor.setCursorBufferPosition([bufferRow, columnToMoveTo]);
      }
    };

    AutoIndent.prototype.didStopChanging = function() {
      var endPointOfJsx, highestRow, lowestRow, selectedRange, startPointOfJsx;
      if (!this.autoJsx) {
        return;
      }
      if (!this.mouseUp) {
        return;
      }
      selectedRange = this.editor.getSelectedBufferRange();
      if (selectedRange.start.row === selectedRange.end.row && selectedRange.start.column === selectedRange.end.column) {
        if (indexOf.call(this.editor.scopeDescriptorForBufferPosition([selectedRange.start.row, selectedRange.start.column]).getScopesArray(), 'JSXStartTagEnd') >= 0) {
          return;
        }
        if (indexOf.call(this.editor.scopeDescriptorForBufferPosition([selectedRange.start.row, selectedRange.start.column]).getScopesArray(), 'JSXEndTagStart') >= 0) {
          return;
        }
      }
      highestRow = Math.max(selectedRange.start.row, selectedRange.end.row);
      lowestRow = Math.min(selectedRange.start.row, selectedRange.end.row);
      this.onDidStopChangingHandler.dispose();
      while (highestRow >= lowestRow) {
        if (this.jsxInScope(highestRow)) {
          endPointOfJsx = new Point(highestRow, 0);
          startPointOfJsx = autoCompleteJSX.getStartOfJSX(this.editor, endPointOfJsx);
          this.indentJSX(new Range(startPointOfJsx, endPointOfJsx));
          highestRow = startPointOfJsx.row - 1;
        } else {
          highestRow = highestRow - 1;
        }
      }
      setTimeout(this.handleOnDidStopChanging, 300);
    };

    AutoIndent.prototype.handleOnDidStopChanging = function() {
      return this.onDidStopChangingHandler = this.editor.onDidStopChanging((function(_this) {
        return function() {
          return _this.didStopChanging();
        };
      })(this));
    };

    AutoIndent.prototype.jsxInScope = function(bufferRow) {
      var scopes;
      scopes = this.editor.scopeDescriptorForBufferPosition([bufferRow, 0]).getScopesArray();
      return indexOf.call(scopes, 'meta.tag.jsx') >= 0;
    };

    AutoIndent.prototype.indentJSX = function(range) {
      var blankLineEndPos, firstCharIndentation, firstTagInLineIndentation, idxOfToken, indent, indentRecalc, isFirstTagOfBlock, isFirstTokenOfLine, j, line, match, matchColumn, matchPointEnd, matchPointStart, matchRange, parentTokenIdx, ref1, ref2, ref3, results, row, stackOfTokensStillOpen, token, tokenIndentation, tokenOnThisLine, tokenStack;
      tokenStack = [];
      idxOfToken = 0;
      stackOfTokensStillOpen = [];
      indent = 0;
      isFirstTagOfBlock = true;
      this.JSXREGEXP.lastIndex = 0;
      this.templateDepth = 0;
      results = [];
      for (row = j = ref1 = range.start.row, ref2 = range.end.row; ref1 <= ref2 ? j <= ref2 : j >= ref2; row = ref1 <= ref2 ? ++j : --j) {
        isFirstTokenOfLine = true;
        tokenOnThisLine = false;
        indentRecalc = false;
        firstTagInLineIndentation = 0;
        line = this.editor.lineTextForBufferRow(row);
        while ((match = this.JSXREGEXP.exec(line)) !== null) {
          matchColumn = match.index;
          matchPointStart = new Point(row, matchColumn);
          matchPointEnd = new Point(row, matchColumn + match[0].length - 1);
          matchRange = new Range(matchPointStart, matchPointEnd);
          if (row === range.start.row && matchColumn < range.start.column) {
            continue;
          }
          if (!(token = this.getToken(row, match))) {
            continue;
          }
          firstCharIndentation = this.editor.indentationForBufferRow(row);
          if (this.editor.getSoftTabs()) {
            tokenIndentation = matchColumn / this.editor.getTabLength();
          } else {
            tokenIndentation = (function(editor) {
              var charsFound, hardTabsFound, i, k, ref3;
              this.editor = editor;
              hardTabsFound = charsFound = 0;
              for (i = k = 0, ref3 = matchColumn; 0 <= ref3 ? k < ref3 : k > ref3; i = 0 <= ref3 ? ++k : --k) {
                if ((line.substr(i, 1)) === '\t') {
                  hardTabsFound++;
                } else {
                  charsFound++;
                }
              }
              return hardTabsFound + (charsFound / this.editor.getTabLength());
            })(this.editor);
          }
          switch (token) {
            case JSXTAG_OPEN:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (isFirstTagOfBlock && (parentTokenIdx != null) && (tokenStack[parentTokenIdx].type === BRACE_OPEN || tokenStack[parentTokenIdx].type === JSXBRACE_OPEN)) {
                  firstTagInLineIndentation = tokenIndentation;
                  firstCharIndentation = this.eslintIndentOptions.jsxIndent[1] + tokenStack[parentTokenIdx].firstCharIndentation;
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: firstCharIndentation
                  });
                } else if (isFirstTagOfBlock && (parentTokenIdx != null)) {
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: this.getIndentOfPreviousRow(row),
                    jsxIndent: 1
                  });
                } else if ((parentTokenIdx != null) && this.ternaryTerminatesPreviousLine(row)) {
                  firstTagInLineIndentation = tokenIndentation;
                  firstCharIndentation = this.getIndentOfPreviousRow(row);
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: firstCharIndentation
                  });
                } else if (parentTokenIdx != null) {
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                    jsxIndent: 1
                  });
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTokenOfLine = false;
              isFirstTagOfBlock = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: JSXTAG_OPEN,
                name: match[2],
                row: row,
                firstTagInLineIndentation: firstTagInLineIndentation,
                tokenIndentation: tokenIndentation,
                firstCharIndentation: firstCharIndentation,
                parentTokenIdx: parentTokenIdx,
                termsThisTagsAttributesIdx: null,
                termsThisTagIdx: null
              });
              stackOfTokensStillOpen.push(idxOfToken);
              idxOfToken++;
              break;
            case JSXTAG_CLOSE:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                indentRecalc = this.indentRow({
                  row: row,
                  blockIndent: tokenStack[parentTokenIdx].firstCharIndentation
                });
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTokenOfLine = false;
              isFirstTagOfBlock = false;
              parentTokenIdx = stackOfTokensStillOpen.pop();
              tokenStack.push({
                type: JSXTAG_CLOSE,
                name: match[5],
                row: row,
                parentTokenIdx: parentTokenIdx
              });
              if (parentTokenIdx >= 0) {
                tokenStack[parentTokenIdx].termsThisTagIdx = idxOfToken;
              }
              idxOfToken++;
              break;
            case JSXTAG_SELFCLOSE_END:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                indentRecalc = this.indentForClosingBracket(row, tokenStack[parentTokenIdx], this.eslintIndentOptions.jsxClosingBracketLocation[1].selfClosing);
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTagOfBlock = false;
              isFirstTokenOfLine = false;
              parentTokenIdx = stackOfTokensStillOpen.pop();
              tokenStack.push({
                type: JSXTAG_SELFCLOSE_END,
                name: tokenStack[parentTokenIdx].name,
                row: row,
                parentTokenIdx: parentTokenIdx
              });
              if (parentTokenIdx >= 0) {
                tokenStack[parentTokenIdx].termsThisTagsAttributesIdx = idxOfToken;
                tokenStack[parentTokenIdx].type = JSXTAG_SELFCLOSE_START;
                tokenStack[parentTokenIdx].termsThisTagIdx = idxOfToken;
              }
              idxOfToken++;
              break;
            case JSXTAG_CLOSE_ATTRS:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                indentRecalc = this.indentForClosingBracket(row, tokenStack[parentTokenIdx], this.eslintIndentOptions.jsxClosingBracketLocation[1].nonEmpty);
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTagOfBlock = false;
              isFirstTokenOfLine = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: JSXTAG_CLOSE_ATTRS,
                name: tokenStack[parentTokenIdx].name,
                row: row,
                parentTokenIdx: parentTokenIdx
              });
              if (parentTokenIdx >= 0) {
                tokenStack[parentTokenIdx].termsThisTagsAttributesIdx = idxOfToken;
              }
              idxOfToken++;
              break;
            case JSXBRACE_OPEN:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (parentTokenIdx != null) {
                  if (tokenStack[parentTokenIdx].type === JSXTAG_OPEN && tokenStack[parentTokenIdx].termsThisTagsAttributesIdx === null) {
                    indentRecalc = this.indentRow({
                      row: row,
                      blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                      jsxIndentProps: 1
                    });
                  } else {
                    indentRecalc = this.indentRow({
                      row: row,
                      blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                      jsxIndent: 1
                    });
                  }
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTagOfBlock = true;
              isFirstTokenOfLine = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: token,
                name: '',
                row: row,
                firstTagInLineIndentation: firstTagInLineIndentation,
                tokenIndentation: tokenIndentation,
                firstCharIndentation: firstCharIndentation,
                parentTokenIdx: parentTokenIdx,
                termsThisTagsAttributesIdx: null,
                termsThisTagIdx: null
              });
              stackOfTokensStillOpen.push(idxOfToken);
              idxOfToken++;
              break;
            case TERNARY_IF:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                if (firstCharIndentation === tokenIndentation) {
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: this.getIndentOfPreviousRow(row),
                    jsxIndent: 1
                  });
                } else {
                  stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                  if (parentTokenIdx != null) {
                    if (tokenStack[parentTokenIdx].type === JSXTAG_OPEN && tokenStack[parentTokenIdx].termsThisTagsAttributesIdx === null) {
                      indentRecalc = this.indentRow({
                        row: row,
                        blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                        jsxIndentProps: 1
                      });
                    } else {
                      indentRecalc = this.indentRow({
                        row: row,
                        blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                        jsxIndent: 1
                      });
                    }
                  }
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTagOfBlock = true;
              isFirstTokenOfLine = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: token,
                name: '',
                row: row,
                firstTagInLineIndentation: firstTagInLineIndentation,
                tokenIndentation: tokenIndentation,
                firstCharIndentation: firstCharIndentation,
                parentTokenIdx: parentTokenIdx,
                termsThisTagsAttributesIdx: null,
                termsThisTagIdx: null
              });
              stackOfTokensStillOpen.push(idxOfToken);
              idxOfToken++;
              break;
            case JSXBRACE_CLOSE:
            case TERNARY_ELSE:
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                indentRecalc = this.indentRow({
                  row: row,
                  blockIndent: tokenStack[parentTokenIdx].firstCharIndentation
                });
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTagOfBlock = false;
              isFirstTokenOfLine = false;
              parentTokenIdx = stackOfTokensStillOpen.pop();
              tokenStack.push({
                type: token,
                name: '',
                row: row,
                parentTokenIdx: parentTokenIdx
              });
              if (parentTokenIdx >= 0) {
                tokenStack[parentTokenIdx].termsThisTagIdx = idxOfToken;
              }
              idxOfToken++;
              break;
            case BRACE_OPEN:
            case SWITCH_BRACE_OPEN:
            case PAREN_OPEN:
            case TEMPLATE_START:
              tokenOnThisLine = true;
              if (token === TEMPLATE_START) {
                this.templateDepth++;
              }
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (isFirstTagOfBlock && (parentTokenIdx != null) && tokenStack[parentTokenIdx].type === token && tokenStack[parentTokenIdx].row === (row - 1)) {
                  tokenIndentation = firstCharIndentation = this.eslintIndentOptions.jsxIndent[1] + this.getIndentOfPreviousRow(row);
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: firstCharIndentation
                  });
                } else if ((parentTokenIdx != null) && this.ternaryTerminatesPreviousLine(row)) {
                  firstTagInLineIndentation = tokenIndentation;
                  firstCharIndentation = this.getIndentOfPreviousRow(row);
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: firstCharIndentation
                  });
                } else if (parentTokenIdx != null) {
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                    jsxIndent: 1
                  });
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTokenOfLine = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: token,
                name: '',
                row: row,
                firstTagInLineIndentation: firstTagInLineIndentation,
                tokenIndentation: tokenIndentation,
                firstCharIndentation: firstCharIndentation,
                parentTokenIdx: parentTokenIdx,
                termsThisTagsAttributesIdx: null,
                termsThisTagIdx: null
              });
              stackOfTokensStillOpen.push(idxOfToken);
              idxOfToken++;
              break;
            case BRACE_CLOSE:
            case SWITCH_BRACE_CLOSE:
            case PAREN_CLOSE:
            case TEMPLATE_END:
              if (token === SWITCH_BRACE_CLOSE) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (tokenStack[parentTokenIdx].type === SWITCH_CASE || tokenStack[parentTokenIdx].type === SWITCH_DEFAULT) {
                  stackOfTokensStillOpen.pop();
                }
              }
              tokenOnThisLine = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (parentTokenIdx != null) {
                  indentRecalc = this.indentRow({
                    row: row,
                    blockIndent: tokenStack[parentTokenIdx].firstCharIndentation
                  });
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTokenOfLine = false;
              parentTokenIdx = stackOfTokensStillOpen.pop();
              if (parentTokenIdx != null) {
                tokenStack.push({
                  type: token,
                  name: '',
                  row: row,
                  parentTokenIdx: parentTokenIdx
                });
                if (parentTokenIdx >= 0) {
                  tokenStack[parentTokenIdx].termsThisTagIdx = idxOfToken;
                }
                idxOfToken++;
              }
              if (token === TEMPLATE_END) {
                this.templateDepth--;
              }
              break;
            case SWITCH_CASE:
            case SWITCH_DEFAULT:
              tokenOnThisLine = true;
              isFirstTagOfBlock = true;
              if (isFirstTokenOfLine) {
                stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
                if (parentTokenIdx != null) {
                  if (tokenStack[parentTokenIdx].type === SWITCH_CASE || tokenStack[parentTokenIdx].type === SWITCH_DEFAULT) {
                    indentRecalc = this.indentRow({
                      row: row,
                      blockIndent: tokenStack[parentTokenIdx].firstCharIndentation
                    });
                    stackOfTokensStillOpen.pop();
                  } else if (tokenStack[parentTokenIdx].type === SWITCH_BRACE_OPEN) {
                    indentRecalc = this.indentRow({
                      row: row,
                      blockIndent: tokenStack[parentTokenIdx].firstCharIndentation,
                      jsxIndent: 1
                    });
                  }
                }
              }
              if (indentRecalc) {
                line = this.editor.lineTextForBufferRow(row);
                this.JSXREGEXP.lastIndex = 0;
                continue;
              }
              isFirstTokenOfLine = false;
              stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
              tokenStack.push({
                type: token,
                name: '',
                row: row,
                firstTagInLineIndentation: firstTagInLineIndentation,
                tokenIndentation: tokenIndentation,
                firstCharIndentation: firstCharIndentation,
                parentTokenIdx: parentTokenIdx,
                termsThisTagsAttributesIdx: null,
                termsThisTagIdx: null
              });
              stackOfTokensStillOpen.push(idxOfToken);
              idxOfToken++;
              break;
            case JS_IF:
            case JS_ELSE:
            case JS_RETURN:
              isFirstTagOfBlock = true;
          }
        }
        if (idxOfToken && !tokenOnThisLine) {
          if (row !== range.end.row) {
            blankLineEndPos = (ref3 = /^\s*$/.exec(this.editor.lineTextForBufferRow(row))) != null ? ref3[0].length : void 0;
            if (blankLineEndPos != null) {
              results.push(this.indentRow({
                row: row,
                blockIndent: 0
              }));
            } else {
              results.push(this.indentUntokenisedLine(row, tokenStack, stackOfTokensStillOpen));
            }
          } else {
            results.push(this.indentUntokenisedLine(row, tokenStack, stackOfTokensStillOpen));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    AutoIndent.prototype.indentUntokenisedLine = function(row, tokenStack, stackOfTokensStillOpen) {
      var parentTokenIdx, token;
      stackOfTokensStillOpen.push(parentTokenIdx = stackOfTokensStillOpen.pop());
      if (parentTokenIdx == null) {
        return;
      }
      token = tokenStack[parentTokenIdx];
      switch (token.type) {
        case JSXTAG_OPEN:
        case JSXTAG_SELFCLOSE_START:
          if (token.termsThisTagsAttributesIdx === null) {
            return this.indentRow({
              row: row,
              blockIndent: token.firstCharIndentation,
              jsxIndentProps: 1
            });
          } else {
            return this.indentRow({
              row: row,
              blockIndent: token.firstCharIndentation,
              jsxIndent: 1
            });
          }
          break;
        case JSXBRACE_OPEN:
        case TERNARY_IF:
          return this.indentRow({
            row: row,
            blockIndent: token.firstCharIndentation,
            jsxIndent: 1,
            allowAdditionalIndents: true
          });
        case BRACE_OPEN:
        case SWITCH_BRACE_OPEN:
        case PAREN_OPEN:
          return this.indentRow({
            row: row,
            blockIndent: token.firstCharIndentation,
            jsxIndent: 1,
            allowAdditionalIndents: true
          });
        case JSXTAG_SELFCLOSE_END:
        case JSXBRACE_CLOSE:
        case JSXTAG_CLOSE_ATTRS:
        case TERNARY_ELSE:
          return this.indentRow({
            row: row,
            blockIndent: tokenStack[token.parentTokenIdx].firstCharIndentation,
            jsxIndentProps: 1
          });
        case BRACE_CLOSE:
        case SWITCH_BRACE_CLOSE:
        case PAREN_CLOSE:
          return this.indentRow({
            row: row,
            blockIndent: tokenStack[token.parentTokenIdx].firstCharIndentation,
            jsxIndent: 1,
            allowAdditionalIndents: true
          });
        case SWITCH_CASE:
        case SWITCH_DEFAULT:
          return this.indentRow({
            row: row,
            blockIndent: token.firstCharIndentation,
            jsxIndent: 1
          });
        case TEMPLATE_START:
        case TEMPLATE_END:
      }
    };

    AutoIndent.prototype.getToken = function(bufferRow, match) {
      var scope;
      scope = this.editor.scopeDescriptorForBufferPosition([bufferRow, match.index]).getScopesArray().pop();
      if ('punctuation.definition.tag.jsx' === scope) {
        if (match[1] != null) {
          return JSXTAG_OPEN;
        } else if (match[3] != null) {
          return JSXTAG_SELFCLOSE_END;
        }
      } else if ('JSXEndTagStart' === scope) {
        if (match[4] != null) {
          return JSXTAG_CLOSE;
        }
      } else if ('JSXStartTagEnd' === scope) {
        if (match[7] != null) {
          return JSXTAG_CLOSE_ATTRS;
        }
      } else if (match[8] != null) {
        if ('punctuation.section.embedded.begin.jsx' === scope) {
          return JSXBRACE_OPEN;
        } else if ('meta.brace.curly.switchStart.js' === scope) {
          return SWITCH_BRACE_OPEN;
        } else if ('meta.brace.curly.js' === scope || 'meta.brace.curly.litobj.js' === scope) {
          return BRACE_OPEN;
        }
      } else if (match[9] != null) {
        if ('punctuation.section.embedded.end.jsx' === scope) {
          return JSXBRACE_CLOSE;
        } else if ('meta.brace.curly.switchEnd.js' === scope) {
          return SWITCH_BRACE_CLOSE;
        } else if ('meta.brace.curly.js' === scope || 'meta.brace.curly.litobj.js' === scope) {
          return BRACE_CLOSE;
        }
      } else if (match[10] != null) {
        if ('keyword.operator.ternary.js' === scope) {
          return TERNARY_IF;
        }
      } else if (match[11] != null) {
        if ('keyword.operator.ternary.js' === scope) {
          return TERNARY_ELSE;
        }
      } else if (match[12] != null) {
        if ('keyword.control.conditional.js' === scope) {
          return JS_IF;
        }
      } else if (match[13] != null) {
        if ('keyword.control.conditional.js' === scope) {
          return JS_ELSE;
        }
      } else if (match[14] != null) {
        if ('keyword.control.switch.js' === scope) {
          return SWITCH_CASE;
        }
      } else if (match[15] != null) {
        if ('keyword.control.switch.js' === scope) {
          return SWITCH_DEFAULT;
        }
      } else if (match[16] != null) {
        if ('keyword.control.flow.js' === scope) {
          return JS_RETURN;
        }
      } else if (match[17] != null) {
        if ('meta.brace.round.js' === scope || 'meta.brace.round.graphql' === scope || 'meta.brace.round.directive.graphql' === scope) {
          return PAREN_OPEN;
        }
      } else if (match[18] != null) {
        if ('meta.brace.round.js' === scope || 'meta.brace.round.graphql' === scope || 'meta.brace.round.directive.graphql' === scope) {
          return PAREN_CLOSE;
        }
      } else if (match[19] != null) {
        if ('punctuation.definition.quasi.begin.js' === scope) {
          return TEMPLATE_START;
        }
        if ('punctuation.definition.quasi.end.js' === scope) {
          return TEMPLATE_END;
        }
      }
      return NO_TOKEN;
    };

    AutoIndent.prototype.getIndentOfPreviousRow = function(row) {
      var j, line, ref1;
      if (!row) {
        return 0;
      }
      for (row = j = ref1 = row - 1; ref1 <= 0 ? j < 0 : j > 0; row = ref1 <= 0 ? ++j : --j) {
        line = this.editor.lineTextForBufferRow(row);
        if (/.*\S/.test(line)) {
          return this.editor.indentationForBufferRow(row);
        }
      }
      return 0;
    };

    AutoIndent.prototype.getIndentOptions = function() {
      var eslintrcFilename;
      if (!this.autoJsx) {
        return this.translateIndentOptions();
      }
      if (eslintrcFilename = this.getEslintrcFilename()) {
        eslintrcFilename = new File(eslintrcFilename);
        return this.translateIndentOptions(this.readEslintrcOptions(eslintrcFilename.getPath()));
      } else {
        return this.translateIndentOptions({});
      }
    };

    AutoIndent.prototype.getEslintrcFilename = function() {
      var projectContainingSource;
      projectContainingSource = atom.project.relativizePath(this.editor.getPath());
      if (projectContainingSource[0] != null) {
        return path.join(projectContainingSource[0], '.eslintrc');
      }
    };

    AutoIndent.prototype.onMouseDown = function() {
      return this.mouseUp = false;
    };

    AutoIndent.prototype.onMouseUp = function() {
      return this.mouseUp = true;
    };

    AutoIndent.prototype.readEslintrcOptions = function(eslintrcFile) {
      var err, eslintRules, fileContent;
      if (fs.existsSync(eslintrcFile)) {
        fileContent = stripJsonComments(fs.readFileSync(eslintrcFile, 'utf8'));
        try {
          eslintRules = (YAML.safeLoad(fileContent)).rules;
          if (eslintRules) {
            return eslintRules;
          }
        } catch (error) {
          err = error;
          atom.notifications.addError("LB: Error reading .eslintrc at " + eslintrcFile, {
            dismissable: true,
            detail: "" + err.message
          });
        }
      }
      return {};
    };

    AutoIndent.prototype.translateIndentOptions = function(eslintRules) {
      var ES_DEFAULT_INDENT, defaultIndent, eslintIndentOptions, rule;
      eslintIndentOptions = {
        jsxIndent: [1, 1],
        jsxIndentProps: [1, 1],
        jsxClosingBracketLocation: [
          1, {
            selfClosing: TAGALIGNED,
            nonEmpty: TAGALIGNED
          }
        ]
      };
      if (typeof eslintRules !== "object") {
        return eslintIndentOptions;
      }
      ES_DEFAULT_INDENT = 4;
      rule = eslintRules['indent'];
      if (typeof rule === 'number' || typeof rule === 'string') {
        defaultIndent = ES_DEFAULT_INDENT / this.editor.getTabLength();
      } else if (typeof rule === 'object') {
        if (typeof rule[1] === 'number') {
          defaultIndent = rule[1] / this.editor.getTabLength();
        } else {
          defaultIndent = 1;
        }
      } else {
        defaultIndent = 1;
      }
      rule = eslintRules['react/jsx-indent'];
      if (typeof rule === 'number' || typeof rule === 'string') {
        eslintIndentOptions.jsxIndent[0] = rule;
        eslintIndentOptions.jsxIndent[1] = ES_DEFAULT_INDENT / this.editor.getTabLength();
      } else if (typeof rule === 'object') {
        eslintIndentOptions.jsxIndent[0] = rule[0];
        if (typeof rule[1] === 'number') {
          eslintIndentOptions.jsxIndent[1] = rule[1] / this.editor.getTabLength();
        } else {
          eslintIndentOptions.jsxIndent[1] = 1;
        }
      } else {
        eslintIndentOptions.jsxIndent[1] = defaultIndent;
      }
      rule = eslintRules['react/jsx-indent-props'];
      if (typeof rule === 'number' || typeof rule === 'string') {
        eslintIndentOptions.jsxIndentProps[0] = rule;
        eslintIndentOptions.jsxIndentProps[1] = ES_DEFAULT_INDENT / this.editor.getTabLength();
      } else if (typeof rule === 'object') {
        eslintIndentOptions.jsxIndentProps[0] = rule[0];
        if (typeof rule[1] === 'number') {
          eslintIndentOptions.jsxIndentProps[1] = rule[1] / this.editor.getTabLength();
        } else {
          eslintIndentOptions.jsxIndentProps[1] = 1;
        }
      } else {
        eslintIndentOptions.jsxIndentProps[1] = defaultIndent;
      }
      rule = eslintRules['react/jsx-closing-bracket-location'];
      if (typeof rule === 'number' || typeof rule === 'string') {
        eslintIndentOptions.jsxClosingBracketLocation[0] = rule;
      } else if (typeof rule === 'object') {
        eslintIndentOptions.jsxClosingBracketLocation[0] = rule[0];
        if (typeof rule[1] === 'string') {
          eslintIndentOptions.jsxClosingBracketLocation[1].selfClosing = eslintIndentOptions.jsxClosingBracketLocation[1].nonEmpty = rule[1];
        } else {
          if (rule[1].selfClosing != null) {
            eslintIndentOptions.jsxClosingBracketLocation[1].selfClosing = rule[1].selfClosing;
          }
          if (rule[1].nonEmpty != null) {
            eslintIndentOptions.jsxClosingBracketLocation[1].nonEmpty = rule[1].nonEmpty;
          }
        }
      }
      return eslintIndentOptions;
    };

    AutoIndent.prototype.ternaryTerminatesPreviousLine = function(row) {
      var line, match, scope;
      row--;
      if (!(row >= 0)) {
        return false;
      }
      line = this.editor.lineTextForBufferRow(row);
      match = /:\s*$/.exec(line);
      if (match === null) {
        return false;
      }
      scope = this.editor.scopeDescriptorForBufferPosition([row, match.index]).getScopesArray().pop();
      if (scope !== 'keyword.operator.ternary.js') {
        return false;
      }
      return true;
    };

    AutoIndent.prototype.indentForClosingBracket = function(row, parentTag, closingBracketRule) {
      if (this.eslintIndentOptions.jsxClosingBracketLocation[0]) {
        if (closingBracketRule === TAGALIGNED) {
          return this.indentRow({
            row: row,
            blockIndent: parentTag.tokenIndentation
          });
        } else if (closingBracketRule === LINEALIGNED) {
          return this.indentRow({
            row: row,
            blockIndent: parentTag.firstCharIndentation
          });
        } else if (closingBracketRule === AFTERPROPS) {
          if (this.eslintIndentOptions.jsxIndentProps[0]) {
            return this.indentRow({
              row: row,
              blockIndent: parentTag.firstCharIndentation,
              jsxIndentProps: 1
            });
          } else {
            return this.indentRow({
              row: row,
              blockIndent: parentTag.firstCharIndentation
            });
          }
        } else if (closingBracketRule === PROPSALIGNED) {
          if (this.eslintIndentOptions.jsxIndentProps[0]) {
            return this.indentRow({
              row: row,
              blockIndent: parentTag.tokenIndentation,
              jsxIndentProps: 1
            });
          } else {
            return this.indentRow({
              row: row,
              blockIndent: parentTag.tokenIndentation
            });
          }
        }
      }
    };

    AutoIndent.prototype.indentRow = function(options) {
      var allowAdditionalIndents, blockIndent, jsxIndent, jsxIndentProps, row;
      row = options.row, allowAdditionalIndents = options.allowAdditionalIndents, blockIndent = options.blockIndent, jsxIndent = options.jsxIndent, jsxIndentProps = options.jsxIndentProps;
      if (this.templateDepth > 0) {
        return false;
      }
      if (jsxIndent) {
        if (this.eslintIndentOptions.jsxIndent[0]) {
          if (this.eslintIndentOptions.jsxIndent[1]) {
            blockIndent += jsxIndent * this.eslintIndentOptions.jsxIndent[1];
          }
        }
      }
      if (jsxIndentProps) {
        if (this.eslintIndentOptions.jsxIndentProps[0]) {
          if (this.eslintIndentOptions.jsxIndentProps[1]) {
            blockIndent += jsxIndentProps * this.eslintIndentOptions.jsxIndentProps[1];
          }
        }
      }
      if (allowAdditionalIndents) {
        if (this.editor.indentationForBufferRow(row) < blockIndent || this.editor.indentationForBufferRow(row) > blockIndent + allowAdditionalIndents) {
          this.editor.setIndentationForBufferRow(row, blockIndent, {
            preserveLeadingWhitespace: false
          });
          return true;
        }
      } else {
        if (this.editor.indentationForBufferRow(row) !== blockIndent) {
          this.editor.setIndentationForBufferRow(row, blockIndent, {
            preserveLeadingWhitespace: false
          });
          return true;
        }
      }
      return false;
    };

    return AutoIndent;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvbGliL2F1dG8taW5kZW50LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNmZBQUE7SUFBQTs7O0VBQUEsTUFBNEMsT0FBQSxDQUFRLE1BQVIsQ0FBNUMsRUFBQyw2Q0FBRCxFQUFzQixlQUF0QixFQUE0QixpQkFBNUIsRUFBbUM7O0VBQ25DLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsZUFBQSxHQUFrQixPQUFBLENBQVEscUJBQVI7O0VBQ2xCLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLG1CQUFSOztFQUNoQixpQkFBQSxHQUFvQixPQUFBLENBQVEscUJBQVI7O0VBQ3BCLElBQUEsR0FBTyxPQUFBLENBQVEsU0FBUjs7RUFHUCxRQUFBLEdBQTBCOztFQUMxQixzQkFBQSxHQUEwQjs7RUFDMUIsb0JBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGtCQUFBLEdBQTBCOztFQUMxQixZQUFBLEdBQTBCOztFQUMxQixhQUFBLEdBQTBCOztFQUMxQixjQUFBLEdBQTBCOztFQUMxQixVQUFBLEdBQTBCOztFQUMxQixXQUFBLEdBQTBCOztFQUMxQixVQUFBLEdBQTBCOztFQUMxQixZQUFBLEdBQTBCOztFQUMxQixLQUFBLEdBQTBCOztFQUMxQixPQUFBLEdBQTBCOztFQUMxQixpQkFBQSxHQUEwQjs7RUFDMUIsa0JBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGNBQUEsR0FBMEI7O0VBQzFCLFNBQUEsR0FBMEI7O0VBQzFCLFVBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGNBQUEsR0FBMEI7O0VBQzFCLFlBQUEsR0FBMEI7O0VBRzFCLFVBQUEsR0FBZ0I7O0VBQ2hCLFdBQUEsR0FBZ0I7O0VBQ2hC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QUE3QztVQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsMEJBQVIsQ0FBbUMsR0FBbkMsRUFBd0MsV0FBeEMsRUFBcUQ7WUFBRSx5QkFBQSxFQUEyQixLQUE3QjtXQUFyRDtBQUNBLGlCQUFPLEtBRlQ7U0FORjs7QUFTQSxhQUFPO0lBeEJFOzs7OztBQW4wQmIiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRmlsZSwgUmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbmF1dG9Db21wbGV0ZUpTWCA9IHJlcXVpcmUgJy4vYXV0by1jb21wbGV0ZS1qc3gnXG5EaWRJbnNlcnRUZXh0ID0gcmVxdWlyZSAnLi9kaWQtaW5zZXJ0LXRleHQnXG5zdHJpcEpzb25Db21tZW50cyA9IHJlcXVpcmUgJ3N0cmlwLWpzb24tY29tbWVudHMnXG5ZQU1MID0gcmVxdWlyZSAnanMteWFtbCdcblxuXG5OT19UT0tFTiAgICAgICAgICAgICAgICA9IDBcbkpTWFRBR19TRUxGQ0xPU0VfU1RBUlQgID0gMSAgICAgICAjIHRoZSA8dGFnIGluIDx0YWcgLz5cbkpTWFRBR19TRUxGQ0xPU0VfRU5EICAgID0gMiAgICAgICAjIHRoZSAvPiBpbiA8dGFnIC8+XG5KU1hUQUdfT1BFTiAgICAgICAgICAgICA9IDMgICAgICAgIyB0aGUgPHRhZyBpbiA8dGFnPjwvdGFnPlxuSlNYVEFHX0NMT1NFX0FUVFJTICAgICAgPSA0ICAgICAgICMgdGhlIDFzdCA+IGluIDx0YWc+PC90YWc+XG5KU1hUQUdfQ0xPU0UgICAgICAgICAgICA9IDUgICAgICAgIyBhIDwvdGFnPlxuSlNYQlJBQ0VfT1BFTiAgICAgICAgICAgPSA2ICAgICAgICMgZW1iZWRkZWQgZXhwcmVzc2lvbiBicmFjZSBzdGFydCB7XG5KU1hCUkFDRV9DTE9TRSAgICAgICAgICA9IDcgICAgICAgIyBlbWJlZGRlZCBleHByZXNzaW9uIGJyYWNlIGVuZCB9XG5CUkFDRV9PUEVOICAgICAgICAgICAgICA9IDggICAgICAgIyBKYXZhc2NyaXB0IGJyYWNlXG5CUkFDRV9DTE9TRSAgICAgICAgICAgICA9IDkgICAgICAgIyBKYXZhc2NyaXB0IGJyYWNlXG5URVJOQVJZX0lGICAgICAgICAgICAgICA9IDEwICAgICAgIyBUZXJuYXJ5ID9cblRFUk5BUllfRUxTRSAgICAgICAgICAgID0gMTEgICAgICAjIFRlcm5hcnkgOlxuSlNfSUYgICAgICAgICAgICAgICAgICAgPSAxMiAgICAgICMgSlMgSUZcbkpTX0VMU0UgICAgICAgICAgICAgICAgID0gMTMgICAgICAjIEpTIEVMU0VcblNXSVRDSF9CUkFDRV9PUEVOICAgICAgID0gMTQgICAgICAjIG9wZW5pbmcgYnJhY2UgaW4gc3dpdGNoIHsgfVxuU1dJVENIX0JSQUNFX0NMT1NFICAgICAgPSAxNSAgICAgICMgY2xvc2luZyBicmFjZSBpbiBzd2l0Y2ggeyB9XG5TV0lUQ0hfQ0FTRSAgICAgICAgICAgICA9IDE2ICAgICAgIyBzd2l0Y2ggY2FzZSBzdGF0ZW1lbnRcblNXSVRDSF9ERUZBVUxUICAgICAgICAgID0gMTcgICAgICAjIHN3aXRjaCBkZWZhdWx0IHN0YXRlbWVudFxuSlNfUkVUVVJOICAgICAgICAgICAgICAgPSAxOCAgICAgICMgSlMgcmV0dXJuXG5QQVJFTl9PUEVOICAgICAgICAgICAgICA9IDE5ICAgICAgIyBwYXJlbiBvcGVuIChcblBBUkVOX0NMT1NFICAgICAgICAgICAgID0gMjAgICAgICAjIHBhcmVuIGNsb3NlIClcblRFTVBMQVRFX1NUQVJUICAgICAgICAgID0gMjEgICAgICAjIGAgYmFjay10aWNrIHN0YXJ0XG5URU1QTEFURV9FTkQgICAgICAgICAgICA9IDIyICAgICAgIyBgIGJhY2stdGljayBlbmRcblxuIyBlc2xpbnQgcHJvcGVydHkgdmFsdWVzXG5UQUdBTElHTkVEICAgID0gJ3RhZy1hbGlnbmVkJ1xuTElORUFMSUdORUQgICA9ICdsaW5lLWFsaWduZWQnXG5BRlRFUlBST1BTICAgID0gJ2FmdGVyLXByb3BzJ1xuUFJPUFNBTElHTkVEICA9ICdwcm9wcy1hbGlnbmVkJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBBdXRvSW5kZW50XG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT5cbiAgICBARGlkSW5zZXJ0VGV4dCA9IG5ldyBEaWRJbnNlcnRUZXh0KEBlZGl0b3IpXG4gICAgQGF1dG9Kc3ggPSBhdG9tLmNvbmZpZy5nZXQoJ2xhbmd1YWdlLWJhYmVsJykuYXV0b0luZGVudEpTWFxuICAgICMgcmVnZXggdG8gc2VhcmNoIGZvciB0YWcgb3Blbi9jbG9zZSB0YWcgYW5kIGNsb3NlIHRhZ1xuICAgIEBKU1hSRUdFWFAgPSAvKDwpKFskX0EtWmEtel0oPzpbJF8uOlxcLUEtWmEtejAtOV0pKil8KFxcLz4pfCg8XFwvKShbJF9BLVphLXpdKD86WyQuXzpcXC1BLVphLXowLTldKSopKD4pfCg+KXwoeyl8KH0pfChcXD8pfCg6KXwoaWYpfChlbHNlKXwoY2FzZSl8KGRlZmF1bHQpfChyZXR1cm4pfChcXCgpfChcXCkpfChgKS9nXG4gICAgQG1vdXNlVXAgPSB0cnVlXG4gICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlciA9IDFcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG4gICAgQHRlbXBsYXRlRGVwdGggPSAwICMgdHJhY2sgZGVwdGggb2YgYW55IGVtYmVkZGVkIGJhY2stdGljayB0ZW1wbGF0ZXNcblxuICAgICMgT2JzZXJ2ZSBhdXRvSW5kZW50SlNYIGZvciBleGlzdGluZyBlZGl0b3JzXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsYW5ndWFnZS1iYWJlbC5hdXRvSW5kZW50SlNYJyxcbiAgICAgICh2YWx1ZSkgPT4gQGF1dG9Kc3ggPSB2YWx1ZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6YXV0by1pbmRlbnQtanN4LW9uJzogKGV2ZW50KSA9PlxuICAgICAgICBAYXV0b0pzeCA9IHRydWVcbiAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdsYW5ndWFnZS1iYWJlbDphdXRvLWluZGVudC1qc3gtb2ZmJzogKGV2ZW50KSA9PiAgQGF1dG9Kc3ggPSBmYWxzZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6dG9nZ2xlLWF1dG8taW5kZW50LWpzeCc6IChldmVudCkgPT5cbiAgICAgICAgQGF1dG9Kc3ggPSBub3QgQGF1dG9Kc3hcbiAgICAgICAgaWYgQGF1dG9Kc3ggdGhlbiBAZXNsaW50SW5kZW50T3B0aW9ucyA9IEBnZXRJbmRlbnRPcHRpb25zKClcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiAoZXZlbnQpID0+IEBjaGFuZ2VkQ3Vyc29yUG9zaXRpb24oZXZlbnQpXG4gICAgQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nKClcblxuICBkZXN0cm95OiAoKSAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgIyBjaGFuZ2VkIGN1cnNvciBwb3NpdGlvblxuICBjaGFuZ2VkQ3Vyc29yUG9zaXRpb246IChldmVudCkgPT5cbiAgICByZXR1cm4gdW5sZXNzIEBhdXRvSnN4XG4gICAgcmV0dXJuIHVubGVzcyBAbW91c2VVcFxuICAgIHJldHVybiB1bmxlc3MgZXZlbnQub2xkQnVmZmVyUG9zaXRpb24ucm93IGlzbnQgZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgYnVmZmVyUm93ID0gZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgIyBoYW5kbGUgbXVsdGlwbGUgY3Vyc29ycy4gb25seSB0cmlnZ2VyIGluZGVudCBvbiBvbmUgY2hhbmdlIGV2ZW50XG4gICAgIyBhbmQgdGhlbiBvbmx5IGF0IHRoZSBoaWdoZXN0IHJvd1xuICAgIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICAgIGN1cnNvclBvc2l0aW9ucyA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcbiAgICAgIGlmIGN1cnNvclBvc2l0aW9ucy5sZW5ndGggaXMgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlclxuICAgICAgICBAbXVsdGlwbGVDdXJzb3JUcmlnZ2VyID0gMVxuICAgICAgICBidWZmZXJSb3cgPSAwXG4gICAgICAgIGZvciBjdXJzb3JQb3NpdGlvbiBpbiBjdXJzb3JQb3NpdGlvbnNcbiAgICAgICAgICBpZiBjdXJzb3JQb3NpdGlvbi5yb3cgPiBidWZmZXJSb3cgdGhlbiBidWZmZXJSb3cgPSBjdXJzb3JQb3NpdGlvbi5yb3dcbiAgICAgIGVsc2VcbiAgICAgICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlcisrXG4gICAgICAgIHJldHVyblxuICAgIGVsc2UgY3Vyc29yUG9zaXRpb24gPSBldmVudC5uZXdCdWZmZXJQb3NpdGlvblxuXG4gICAgIyByZW1vdmUgYW55IGJsYW5rIGxpbmVzIGZyb20gd2hlcmUgY3Vyc29yIHdhcyBwcmV2aW91c2x5XG4gICAgcHJldmlvdXNSb3cgPSBldmVudC5vbGRCdWZmZXJQb3NpdGlvbi5yb3dcbiAgICBpZiBAanN4SW5TY29wZShwcmV2aW91c1JvdylcbiAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwcmV2aW91c1JvdykpP1swXS5sZW5ndGhcbiAgICAgIGlmIGJsYW5rTGluZUVuZFBvcz9cbiAgICAgICAgQGluZGVudFJvdyh7cm93OiBwcmV2aW91c1JvdyAsIGJsb2NrSW5kZW50OiAwIH0pXG5cbiAgICByZXR1cm4gaWYgbm90IEBqc3hJblNjb3BlIGJ1ZmZlclJvd1xuXG4gICAgZW5kUG9pbnRPZkpzeCA9IG5ldyBQb2ludCBidWZmZXJSb3csMCAjIG5leHQgcm93IHN0YXJ0XG4gICAgc3RhcnRQb2ludE9mSnN4ID0gIGF1dG9Db21wbGV0ZUpTWC5nZXRTdGFydE9mSlNYIEBlZGl0b3IsIGN1cnNvclBvc2l0aW9uXG4gICAgQGluZGVudEpTWCBuZXcgUmFuZ2Uoc3RhcnRQb2ludE9mSnN4LCBlbmRQb2ludE9mSnN4KVxuICAgIGNvbHVtblRvTW92ZVRvID0gL15cXHMqJC8uZXhlYyhAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGJ1ZmZlclJvdykpP1swXS5sZW5ndGhcbiAgICBpZiBjb2x1bW5Ub01vdmVUbz8gdGhlbiBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFtidWZmZXJSb3csIGNvbHVtblRvTW92ZVRvXVxuXG5cbiAgIyBCdWZmZXIgaGFzIHN0b3BwZWQgY2hhbmdpbmcuIEluZGVudCBhcyByZXF1aXJlZFxuICBkaWRTdG9wQ2hhbmdpbmc6ICgpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYXV0b0pzeFxuICAgIHJldHVybiB1bmxlc3MgQG1vdXNlVXBcbiAgICBzZWxlY3RlZFJhbmdlID0gQGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICAjIGlmIHRoaXMgaXMgYSB0YWcgc3RhcnQncyBlbmQgPiBvciA8LyB0aGVuIGRvbid0IGF1dG8gaW5kZW50XG4gICAgIyB0aGlzIGlhIGZpeCB0byBhbGxvdyBmb3IgdGhlIGF1dG8gY29tcGxldGUgdGFnIHRpbWUgdG8gcG9wIHVwXG4gICAgaWYgc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3cgaXMgc2VsZWN0ZWRSYW5nZS5lbmQucm93IGFuZFxuICAgICAgc2VsZWN0ZWRSYW5nZS5zdGFydC5jb2x1bW4gaXMgc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uXG4gICAgICAgIHJldHVybiBpZiAnSlNYU3RhcnRUYWdFbmQnIGluIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3NlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLnN0YXJ0LmNvbHVtbl0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgcmV0dXJuIGlmICdKU1hFbmRUYWdTdGFydCcgaW4gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3csIHNlbGVjdGVkUmFuZ2Uuc3RhcnQuY29sdW1uXSkuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgaGlnaGVzdFJvdyA9IE1hdGgubWF4IHNlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLmVuZC5yb3dcbiAgICBsb3dlc3RSb3cgPSBNYXRoLm1pbiBzZWxlY3RlZFJhbmdlLnN0YXJ0LnJvdywgc2VsZWN0ZWRSYW5nZS5lbmQucm93XG5cbiAgICAjIHJlbW92ZSB0aGUgaGFuZGxlciBmb3IgZGlkU3RvcENoYW5naW5nIHRvIGF2b2lkIHRoaXMgY2hhbmdlIGNhdXNpbmcgYSBuZXcgZXZlbnRcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuXG4gICAgIyB3b3JrIGJhY2t3YXJkcyB0aHJvdWdoIGJ1ZmZlciByb3dzIGluZGVudGluZyBKU1ggYXMgbmVlZGVkXG4gICAgd2hpbGUgKCBoaWdoZXN0Um93ID49IGxvd2VzdFJvdyApXG4gICAgICBpZiBAanN4SW5TY29wZShoaWdoZXN0Um93KVxuICAgICAgICBlbmRQb2ludE9mSnN4ID0gbmV3IFBvaW50IGhpZ2hlc3RSb3csMFxuICAgICAgICBzdGFydFBvaW50T2ZKc3ggPSAgYXV0b0NvbXBsZXRlSlNYLmdldFN0YXJ0T2ZKU1ggQGVkaXRvciwgZW5kUG9pbnRPZkpzeFxuICAgICAgICBAaW5kZW50SlNYIG5ldyBSYW5nZShzdGFydFBvaW50T2ZKc3gsIGVuZFBvaW50T2ZKc3gpXG4gICAgICAgIGhpZ2hlc3RSb3cgPSBzdGFydFBvaW50T2ZKc3gucm93IC0gMVxuICAgICAgZWxzZSBoaWdoZXN0Um93ID0gaGlnaGVzdFJvdyAtIDFcblxuICAgICMgcmVuYWJsZSB0aGlzIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgMzAwbXMgYXMgcGVyIHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIGNoYW5nZSBldmVudHNcbiAgICAjIHRvIGF2b2lkIHRoaXMgbWV0aG9kIGJlaW5nIHJlY2FsbGVkIVxuICAgIHNldFRpbWVvdXQoQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nLCAzMDApXG4gICAgcmV0dXJuXG5cbiAgaGFuZGxlT25EaWRTdG9wQ2hhbmdpbmc6ID0+XG4gICAgQG9uRGlkU3RvcENoYW5naW5nSGFuZGxlciA9IEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgKCkgPT4gQGRpZFN0b3BDaGFuZ2luZygpXG5cbiAgIyBpcyB0aGUganN4IG9uIHRoaXMgbGluZSBpbiBzY29wZVxuICBqc3hJblNjb3BlOiAoYnVmZmVyUm93KSAtPlxuICAgIHNjb3BlcyA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgMF0pLmdldFNjb3Blc0FycmF5KClcbiAgICByZXR1cm4gJ21ldGEudGFnLmpzeCcgaW4gc2NvcGVzXG5cbiAgIyBpbmRlbnQgdGhlIEpTWCBpbiB0aGUgJ3JhbmdlJyBvZiByb3dzXG4gICMgVGhpcyBpcyBkZXNpZ25lZCB0byBiZSBhIHNpbmdsZSBwYXJzZSBpbmRlbnRlciB0byByZWR1Y2UgdGhlIGltcGFjdCBvbiB0aGUgZWRpdG9yLlxuICAjIEl0IGFzc3VtZXMgdGhlIGdyYW1tYXIgaGFzIGRvbmUgaXRzIGpvYiBhZGRpbmcgc2NvcGVzIHRvIGludGVyZXN0aW5nIHRva2Vucy5cbiAgIyBUaG9zZSBhcmUgSlNYIDx0YWcsID4sIDwvdGFnLCAvPiwgZW1lZGRlZCBleHByZXNzaW9uc1xuICAjIG91dHNpZGUgdGhlIHRhZyBzdGFydGluZyB7IGFuZCBlbmRpbmcgfSBhbmQgamF2YXNjcmlwdCBicmFjZXMgb3V0c2lkZSBhIHRhZyB7ICYgfVxuICAjIGl0IHVzZXMgYW4gYXJyYXkgdG8gaG9sZCB0b2tlbnMgYW5kIGEgcHVzaC9wb3Agc3RhY2sgdG8gaG9sZCB0b2tlbnMgbm90IGNsb3NlZFxuICAjIHRoZSB2ZXJ5IGZpcnN0IGpzeCB0YWcgbXVzdCBiZSBjb3JyZXRseSBpbmRldGVkIGJ5IHRoZSB1c2VyIGFzIHdlIGRvbid0IGhhdmVcbiAgIyBrbm93bGVkZ2Ugb2YgcHJlY2VlZGluZyBKYXZhc2NyaXB0LlxuICBpbmRlbnRKU1g6IChyYW5nZSkgLT5cbiAgICB0b2tlblN0YWNrID0gW11cbiAgICBpZHhPZlRva2VuID0gMFxuICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4gPSBbXSAjIGxlbmd0aCBlcXVpdmFsZW50IHRvIHRva2VuIGRlcHRoXG4gICAgaW5kZW50ID0gIDBcbiAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDBcbiAgICBAdGVtcGxhdGVEZXB0aCA9IDBcblxuICAgIGZvciByb3cgaW4gW3JhbmdlLnN0YXJ0LnJvdy4ucmFuZ2UuZW5kLnJvd11cbiAgICAgIGlzRmlyc3RUb2tlbk9mTGluZSA9IHRydWVcbiAgICAgIHRva2VuT25UaGlzTGluZSA9IGZhbHNlXG4gICAgICBpbmRlbnRSZWNhbGMgPSBmYWxzZVxuICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICAwXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcblxuICAgICAgIyBsb29rIGZvciB0b2tlbnMgaW4gYSBidWZmZXIgbGluZVxuICAgICAgd2hpbGUgKCggbWF0Y2ggPSBASlNYUkVHRVhQLmV4ZWMobGluZSkpIGlzbnQgbnVsbCApXG4gICAgICAgIG1hdGNoQ29sdW1uID0gbWF0Y2guaW5kZXhcbiAgICAgICAgbWF0Y2hQb2ludFN0YXJ0ID0gbmV3IFBvaW50KHJvdywgbWF0Y2hDb2x1bW4pXG4gICAgICAgIG1hdGNoUG9pbnRFbmQgPSBuZXcgUG9pbnQocm93LCBtYXRjaENvbHVtbiArIG1hdGNoWzBdLmxlbmd0aCAtIDEpXG4gICAgICAgIG1hdGNoUmFuZ2UgPSBuZXcgUmFuZ2UobWF0Y2hQb2ludFN0YXJ0LCBtYXRjaFBvaW50RW5kKVxuXG4gICAgICAgIGlmIHJvdyBpcyByYW5nZS5zdGFydC5yb3cgYW5kIG1hdGNoQ29sdW1uIDwgcmFuZ2Uuc3RhcnQuY29sdW1uIHRoZW4gY29udGludWVcbiAgICAgICAgaWYgbm90IHRva2VuID0gIEBnZXRUb2tlbihyb3csIG1hdGNoKSB0aGVuIGNvbnRpbnVlXG5cbiAgICAgICAgZmlyc3RDaGFySW5kZW50YXRpb24gPSAoQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyByb3cpXG4gICAgICAgICMgY29udmVydCB0aGUgbWF0Y2hlZCBjb2x1bW4gcG9zaXRpb24gaW50byB0YWIgaW5kZW50c1xuICAgICAgICBpZiBAZWRpdG9yLmdldFNvZnRUYWJzKClcbiAgICAgICAgICB0b2tlbkluZGVudGF0aW9uID0gKG1hdGNoQ29sdW1uIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKSlcbiAgICAgICAgZWxzZSB0b2tlbkluZGVudGF0aW9uID1cbiAgICAgICAgICBkbyAoQGVkaXRvcikgLT5cbiAgICAgICAgICAgIGhhcmRUYWJzRm91bmQgPSBjaGFyc0ZvdW5kID0gMFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5tYXRjaENvbHVtbl1cbiAgICAgICAgICAgICAgaWYgKChsaW5lLnN1YnN0ciBpLCAxKSBpcyAnXFx0JylcbiAgICAgICAgICAgICAgICBoYXJkVGFic0ZvdW5kKytcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNoYXJzRm91bmQrK1xuICAgICAgICAgICAgcmV0dXJuIGhhcmRUYWJzRm91bmQgKyAoIGNoYXJzRm91bmQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpIClcblxuICAgICAgICAjIGJpZyBzd2l0Y2ggc3RhdGVtZW50IGZvbGxvd3MgZm9yIGVhY2ggdG9rZW4uIElmIHRoZSBsaW5lIGlzIHJlZm9ybWF0ZWRcbiAgICAgICAgIyB0aGVuIHdlIHJlY2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICAgICMgYml0IGhvcnJpZCBidXQgaG9wZWZ1bGx5IGZhc3QuXG4gICAgICAgIHN3aXRjaCAodG9rZW4pXG4gICAgICAgICAgIyB0YWdzIHN0YXJ0aW5nIDx0YWdcbiAgICAgICAgICB3aGVuIEpTWFRBR19PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICAjIGluZGVudCBvbmx5IG9uIGZpcnN0IHRva2VuIG9mIGEgbGluZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgIyBpc0ZpcnN0VGFnT2ZCbG9jayBpcyB1c2VkIHRvIG1hcmsgdGhlIHRhZyB0aGF0IHN0YXJ0cyB0aGUgSlNYIGJ1dFxuICAgICAgICAgICAgICAjIGFsc28gdGhlIGZpcnN0IHRhZyBvZiBibG9ja3MgaW5zaWRlICBlbWJlZGRlZCBleHByZXNzaW9ucy4gZS5nLlxuICAgICAgICAgICAgICAjIDx0Ym9keT4sIDxwQ29tcD4gYW5kIDxvYmplY3RSb3c+IGFyZSBmaXJzdCB0YWdzXG4gICAgICAgICAgICAgICMgcmV0dXJuIChcbiAgICAgICAgICAgICAgIyAgICAgICA8dGJvZHkgY29tcD17PHBDb21wIHByb3BlcnR5IC8+fT5cbiAgICAgICAgICAgICAgIyAgICAgICAgIHtvYmplY3RzLm1hcChmdW5jdGlvbihvYmplY3QsIGkpe1xuICAgICAgICAgICAgICAjICAgICAgICAgICByZXR1cm4gPE9iamVjdFJvdyBvYmo9e29iamVjdH0ga2V5PXtpfSAvPjtcbiAgICAgICAgICAgICAgIyAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAjICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICMgICAgIClcbiAgICAgICAgICAgICAgIyBidXQgd2UgZG9uJ3QgcG9zaXRpb24gdGhlIDx0Ym9keT4gYXMgd2UgaGF2ZSBubyBrbm93bGVkZ2Ugb2YgdGhlIHByZWNlZWRpbmdcbiAgICAgICAgICAgICAgIyBqcyBzeW50YXhcbiAgICAgICAgICAgICAgaWYgaXNGaXJzdFRhZ09mQmxvY2sgYW5kXG4gICAgICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeD8gYW5kXG4gICAgICAgICAgICAgICAgICAoIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgQlJBQ0VfT1BFTiBvclxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hCUkFDRV9PUEVOIClcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgICBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gKyB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZCBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93ICwgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDF9KVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX09QRU5cbiAgICAgICAgICAgICAgbmFtZTogbWF0Y2hbMl1cbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyA8L3RhZz5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRVxuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFXG4gICAgICAgICAgICAgIG5hbWU6IG1hdGNoWzVdXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIHBhcmVudFRva2VuSWR4OiBwYXJlbnRUb2tlbklkeCAgICAgICAgICMgcHRyIHRvIDx0YWdcbiAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4ID49MCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyAvPlxuICAgICAgICAgIHdoZW4gSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICNpZiBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uIGlzIGZpcnN0Q2hhckluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRGb3JDbG9zaW5nQnJhY2tldCAgcm93LFxuICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLFxuICAgICAgICAgICAgICAgIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0uc2VsZkNsb3NpbmdcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgICAgbmFtZTogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0ubmFtZVxuICAgICAgICAgICAgICByb3c6IHJvd1xuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHggICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMFxuICAgICAgICAgICAgICB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSA9IEpTWFRBR19TRUxGQ0xPU0VfU1RBUlRcbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIHRhZ3MgZW5kaW5nID5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRV9BVFRSU1xuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgI2lmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb24gaXMgZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudEZvckNsb3NpbmdCcmFja2V0ICByb3csXG4gICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0sXG4gICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5ub25FbXB0eVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IGZhbHNlXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgICAgICAgICAgIG5hbWU6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLm5hbWVcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIGVtYmVkZWQgZXhwcmVzc2lvbiBzdGFydCB7XG4gICAgICAgICAgd2hlbiBKU1hCUkFDRV9PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIEpTWFRBR19PUEVOIGFuZCB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxfSApXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0ZXJuYXJ5IHN0YXJ0XG4gICAgICAgICAgd2hlbiBURVJOQVJZX0lGXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgIyBpcyB0aGlzIHRlcm5hcnkgc3RhcnRpbmcgYSBuZXcgbGluZVxuICAgICAgICAgICAgICBpZiBmaXJzdENoYXJJbmRlbnRhdGlvbiBpcyB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hUQUdfT1BFTiBhbmQgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHggaXMgbnVsbFxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMX0gKVxuXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBlbWJlZGVkIGV4cHJlc3Npb24gZW5kIH1cbiAgICAgICAgICB3aGVuIEpTWEJSQUNFX0NMT1NFLCBURVJOQVJZX0VMU0VcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcblxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuXG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gb3BlbmluZyB0b2tlblxuXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBTdGFydCB7IG9yIHN3aXRjaCBicmFjZSBzdGFydCB7IG9yIHBhcmVuICggb3IgYmFjay10aWNrIGBzdGFydFxuICAgICAgICAgIHdoZW4gQlJBQ0VfT1BFTiwgU1dJVENIX0JSQUNFX09QRU4sIFBBUkVOX09QRU4sIFRFTVBMQVRFX1NUQVJUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9TVEFSVCB0aGVuIEB0ZW1wbGF0ZURlcHRoKytcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZFxuICAgICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg/IGFuZFxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyB0b2tlbiBhbmRcbiAgICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnJvdyBpcyAoIHJvdyAtIDEpXG4gICAgICAgICAgICAgICAgICAgIHRva2VuSW5kZW50YXRpb24gPSBmaXJzdENoYXJJbmRlbnRhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdICsgQGdldEluZGVudE9mUHJldmlvdXNSb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogZmlyc3RDaGFySW5kZW50YXRpb259KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgIHR5cGU6IHRva2VuXG4gICAgICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb246IGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgdG9rZW5JbmRlbnRhdGlvbjogdG9rZW5JbmRlbnRhdGlvblxuICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbjogZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4XG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4OiBudWxsICAjIHB0ciB0byA+IHRhZ1xuICAgICAgICAgICAgICB0ZXJtc1RoaXNUYWdJZHg6IG51bGwgICAgICAgICAgICAgIyBwdHIgdG8gPC90YWc+XG5cbiAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBFbmQgfSBvciBzd2l0Y2ggYnJhY2UgZW5kIH0gb3IgcGFyZW4gY2xvc2UgKSBvciBiYWNrLXRpY2sgYCBlbmRcbiAgICAgICAgICB3aGVuIEJSQUNFX0NMT1NFLCBTV0lUQ0hfQlJBQ0VfQ0xPU0UsIFBBUkVOX0NMT1NFLCBURU1QTEFURV9FTkRcblxuICAgICAgICAgICAgaWYgdG9rZW4gaXMgU1dJVENIX0JSQUNFX0NMT1NFXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfQ0FTRSBvciB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAjIHNvIG5vdyB3ZSBhcmUgYXQgdGhlIHN3aXRjaCdzIGNsb3NlIGJyYWNlIHdlIHBvcCBvZmYgYW55IGNhc2UvZGVmYXVsdCB0b2tlbnNcbiAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG5cbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24gfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9FTkQgdGhlbiBAdGVtcGxhdGVEZXB0aC0tXG5cbiAgICAgICAgICAjIGNhc2UsIGRlZmF1bHQgc3RhdGVtZW50IG9mIHN3aXRjaFxuICAgICAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGlmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgU1dJVENIX0NBU0Ugb3IgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfREVGQVVMVFxuICAgICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICMgc28gcG9zaXRpb24gbmV3IGNhc2UvZGVmYXVsdCB0byB0aGUgbGFzdCBvbmVzIHBvc2l0aW9uIGFuZCB0aGVuIHBvcCB0aGUgbGFzdCdzXG4gICAgICAgICAgICAgICAgICAjIG9mZiB0aGUgc3RhY2suXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uIH0pXG4gICAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9CUkFDRV9PUEVOXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBUZXJuYXJ5IGFuZCBjb25kaXRpb25hbCBpZi9lbHNlIG9wZXJhdG9yc1xuICAgICAgICAgIHdoZW4gSlNfSUYsIEpTX0VMU0UsIEpTX1JFVFVSTlxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSB0cnVlXG5cbiAgICAgICMgaGFuZGxlIGxpbmVzIHdpdGggbm8gdG9rZW4gb24gdGhlbVxuICAgICAgaWYgaWR4T2ZUb2tlbiBhbmQgbm90IHRva2VuT25UaGlzTGluZVxuICAgICAgICAjIGluZGVudCBsaW5lcyBidXQgcmVtb3ZlIGFueSBibGFuayBsaW5lcyB3aXRoIHdoaXRlIHNwYWNlIGV4Y2VwdCB0aGUgbGFzdCByb3dcbiAgICAgICAgaWYgcm93IGlzbnQgcmFuZ2UuZW5kLnJvd1xuICAgICAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKT9bMF0ubGVuZ3RoXG4gICAgICAgICAgaWYgYmxhbmtMaW5lRW5kUG9zP1xuICAgICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3cgLCBibG9ja0luZGVudDogMCB9KVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmRlbnRVbnRva2VuaXNlZExpbmUgcm93LCB0b2tlblN0YWNrLCBzdGFja09mVG9rZW5zU3RpbGxPcGVuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaW5kZW50VW50b2tlbmlzZWRMaW5lIHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlblxuXG5cbiAgIyBpbmRlbnQgYW55IGxpbmVzIHRoYXQgaGF2ZW4ndCBhbnkgaW50ZXJlc3RpbmcgdG9rZW5zXG4gIGluZGVudFVudG9rZW5pc2VkTGluZTogKHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlbiApIC0+XG4gICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgIHJldHVybiBpZiBub3QgcGFyZW50VG9rZW5JZHg/XG4gICAgdG9rZW4gPSB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XVxuICAgIHN3aXRjaCB0b2tlbi50eXBlXG4gICAgICB3aGVuIEpTWFRBR19PUEVOLCBKU1hUQUdfU0VMRkNMT1NFX1NUQVJUXG4gICAgICAgIGlmICB0b2tlbi50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlbi5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50UHJvcHM6IDEgfSlcbiAgICAgICAgZWxzZSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcbiAgICAgIHdoZW4gSlNYQlJBQ0VfT1BFTiwgVEVSTkFSWV9JRlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBCUkFDRV9PUEVOLCBTV0lUQ0hfQlJBQ0VfT1BFTiwgUEFSRU5fT1BFTlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBKU1hUQUdfU0VMRkNMT1NFX0VORCwgSlNYQlJBQ0VfQ0xPU0UsIEpTWFRBR19DTE9TRV9BVFRSUywgVEVSTkFSWV9FTFNFXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1t0b2tlbi5wYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudFByb3BzOiAxfSlcbiAgICAgIHdoZW4gQlJBQ0VfQ0xPU0UsIFNXSVRDSF9CUkFDRV9DTE9TRSwgUEFSRU5fQ0xPU0VcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3Rva2VuLnBhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxLCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzOiB0cnVlfSlcbiAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW4uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9KVxuICAgICAgd2hlbiBURU1QTEFURV9TVEFSVCwgVEVNUExBVEVfRU5EXG4gICAgICAgIHJldHVybjsgIyBkb24ndCB0b3VjaCB0ZW1wbGF0ZXNcblxuICAjIGdldCB0aGUgdG9rZW4gYXQgdGhlIGdpdmVuIG1hdGNoIHBvc2l0aW9uIG9yIHJldHVybiB0cnV0aHkgZmFsc2VcbiAgZ2V0VG9rZW46IChidWZmZXJSb3csIG1hdGNoKSAtPlxuICAgIHNjb3BlID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUm93LCBtYXRjaC5pbmRleF0pLmdldFNjb3Blc0FycmF5KCkucG9wKClcbiAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi50YWcuanN4JyBpcyBzY29wZVxuICAgICAgaWYgICAgICBtYXRjaFsxXT8gdGhlbiByZXR1cm4gSlNYVEFHX09QRU5cbiAgICAgIGVsc2UgaWYgbWF0Y2hbM10/IHRoZW4gcmV0dXJuIEpTWFRBR19TRUxGQ0xPU0VfRU5EXG4gICAgZWxzZSBpZiAnSlNYRW5kVGFnU3RhcnQnIGlzIHNjb3BlXG4gICAgICBpZiBtYXRjaFs0XT8gdGhlbiByZXR1cm4gSlNYVEFHX0NMT1NFXG4gICAgZWxzZSBpZiAnSlNYU3RhcnRUYWdFbmQnIGlzIHNjb3BlXG4gICAgICBpZiBtYXRjaFs3XT8gdGhlbiByZXR1cm4gSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgZWxzZSBpZiBtYXRjaFs4XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmJlZ2luLmpzeCcgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIEpTWEJSQUNFX09QRU5cbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuc3dpdGNoU3RhcnQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfT1BFTlxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5qcycgaXMgc2NvcGUgb3JcbiAgICAgICAgJ21ldGEuYnJhY2UuY3VybHkubGl0b2JqLmpzJyBpcyBzY29wZVxuICAgICAgICAgIHJldHVybiBCUkFDRV9PUEVOXG4gICAgZWxzZSBpZiBtYXRjaFs5XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmVuZC5qc3gnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU1hCUkFDRV9DTE9TRVxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5zd2l0Y2hFbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfQ0xPU0VcbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuanMnIGlzIHNjb3BlIG9yXG4gICAgICAgICdtZXRhLmJyYWNlLmN1cmx5LmxpdG9iai5qcycgaXMgc2NvcGVcbiAgICAgICAgICByZXR1cm4gQlJBQ0VfQ0xPU0VcbiAgICBlbHNlIGlmIG1hdGNoWzEwXT9cbiAgICAgIGlmICdrZXl3b3JkLm9wZXJhdG9yLnRlcm5hcnkuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURVJOQVJZX0lGXG4gICAgZWxzZSBpZiBtYXRjaFsxMV0/XG4gICAgICBpZiAna2V5d29yZC5vcGVyYXRvci50ZXJuYXJ5LmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gVEVSTkFSWV9FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxMl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmNvbmRpdGlvbmFsLmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gSlNfSUZcbiAgICBlbHNlIGlmIG1hdGNoWzEzXT9cbiAgICAgIGlmICdrZXl3b3JkLmNvbnRyb2wuY29uZGl0aW9uYWwuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNF0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9DQVNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNV0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9ERUZBVUxUXG4gICAgZWxzZSBpZiBtYXRjaFsxNl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmZsb3cuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19SRVRVUk5cbiAgICBlbHNlIGlmIG1hdGNoWzE3XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX09QRU5cbiAgICBlbHNlIGlmIG1hdGNoWzE4XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX0NMT1NFXG4gICAgZWxzZSBpZiBtYXRjaFsxOV0/XG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5iZWdpbi5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFRFTVBMQVRFX1NUQVJUXG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5lbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURU1QTEFURV9FTkRcblxuICAgIHJldHVybiBOT19UT0tFTlxuXG5cbiAgIyBnZXQgaW5kZW50IG9mIHRoZSBwcmV2aW91cyByb3cgd2l0aCBjaGFycyBpbiBpdFxuICBnZXRJbmRlbnRPZlByZXZpb3VzUm93OiAocm93KSAtPlxuICAgIHJldHVybiAwIHVubGVzcyByb3dcbiAgICBmb3Igcm93IGluIFtyb3ctMS4uLjBdXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgIHJldHVybiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93IHJvdyBpZiAgLy4qXFxTLy50ZXN0IGxpbmVcbiAgICByZXR1cm4gMFxuXG4gICMgZ2V0IGVzbGludCB0cmFuc2xhdGVkIGluZGVudCBvcHRpb25zXG4gIGdldEluZGVudE9wdGlvbnM6ICgpIC0+XG4gICAgaWYgbm90IEBhdXRvSnN4IHRoZW4gcmV0dXJuIEB0cmFuc2xhdGVJbmRlbnRPcHRpb25zKClcbiAgICBpZiBlc2xpbnRyY0ZpbGVuYW1lID0gQGdldEVzbGludHJjRmlsZW5hbWUoKVxuICAgICAgZXNsaW50cmNGaWxlbmFtZSA9IG5ldyBGaWxlKGVzbGludHJjRmlsZW5hbWUpXG4gICAgICBAdHJhbnNsYXRlSW5kZW50T3B0aW9ucyhAcmVhZEVzbGludHJjT3B0aW9ucyhlc2xpbnRyY0ZpbGVuYW1lLmdldFBhdGgoKSkpXG4gICAgZWxzZVxuICAgICAgQHRyYW5zbGF0ZUluZGVudE9wdGlvbnMoe30pICMgZ2V0IGRlZmF1bHRzXG5cbiAgIyByZXR1cm4gdGV4dCBzdHJpbmcgb2YgYSBwcm9qZWN0IGJhc2VkIC5lc2xpbnRyYyBmaWxlIGlmIG9uZSBleGlzdHNcbiAgZ2V0RXNsaW50cmNGaWxlbmFtZTogKCkgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBAZWRpdG9yLmdldFBhdGgoKVxuICAgICMgSXMgdGhlIHNvdXJjZUZpbGUgbG9jYXRlZCBpbnNpZGUgYW4gQXRvbSBwcm9qZWN0IGZvbGRlcj9cbiAgICBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXT9cbiAgICAgIHBhdGguam9pbiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSwgJy5lc2xpbnRyYydcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VEb3duOiAoKSA9PlxuICAgIEBtb3VzZVVwID0gZmFsc2VcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VVcDogKCkgPT5cbiAgICBAbW91c2VVcCA9IHRydWVcblxuICAjIHRvIGNyZWF0ZSBpbmRlbnRzLiBXZSBjYW4gcmVhZCBhbmQgcmV0dXJuIHRoZSBydWxlcyBwcm9wZXJ0aWVzIG9yIHVuZGVmaW5lZFxuICByZWFkRXNsaW50cmNPcHRpb25zOiAoZXNsaW50cmNGaWxlKSAtPlxuICAgICMgZ2V0IGxvY2FsIHBhdGggb3ZlcmlkZXNcbiAgICBpZiBmcy5leGlzdHNTeW5jIGVzbGludHJjRmlsZVxuICAgICAgZmlsZUNvbnRlbnQgPSBzdHJpcEpzb25Db21tZW50cyhmcy5yZWFkRmlsZVN5bmMoZXNsaW50cmNGaWxlLCAndXRmOCcpKVxuICAgICAgdHJ5XG4gICAgICAgIGVzbGludFJ1bGVzID0gKFlBTUwuc2FmZUxvYWQgZmlsZUNvbnRlbnQpLnJ1bGVzXG4gICAgICAgIGlmIGVzbGludFJ1bGVzIHRoZW4gcmV0dXJuIGVzbGludFJ1bGVzXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEVycm9yIHJlYWRpbmcgLmVzbGludHJjIGF0ICN7ZXNsaW50cmNGaWxlfVwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcIiN7ZXJyLm1lc3NhZ2V9XCJcbiAgICByZXR1cm4ge31cblxuICAjIHVzZSBlc2xpbnQgcmVhY3QgZm9ybWF0IGRlc2NyaWJlZCBhdCBodHRwOi8vdGlueXVybC5jb20vcDRtdGF0dlxuICAjIHR1cm4gc3BhY2VzIGludG8gdGFiIGRpbWVuc2lvbnMgd2hpY2ggY2FuIGJlIGRlY2ltYWxcbiAgIyBhIGVtcHR5IG9iamVjdCBhcmd1bWVudCBwYXJzZXMgYmFjayB0aGUgZGVmYXVsdCBzZXR0aW5nc1xuICB0cmFuc2xhdGVJbmRlbnRPcHRpb25zOiAoZXNsaW50UnVsZXMpIC0+XG4gICAgIyBFc2xpbnQgcnVsZXMgdG8gdXNlIGFzIGRlZmF1bHQgb3ZlcmlkZGVuIGJ5IC5lc2xpbnRyY1xuICAgICMgTi5CLiB0aGF0IHRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBlc2xpbnQgcnVsZXMgaW4gdGhhdFxuICAgICMgdGhlIHRhYi1zcGFjZXMgYW5kICd0YWIncyBpbiBlc2xpbnRyYyBhcmUgY29udmVydGVkIHRvIHRhYnMgYmFzZWQgdXBvblxuICAgICMgdGhlIEF0b20gZWRpdG9yIHRhYiBzcGFjaW5nLlxuICAgICMgZS5nLiBlc2xpbnQgaW5kZW50IFsxLDRdIHdpdGggYW4gQXRvbSB0YWIgc3BhY2luZyBvZiAyIGJlY29tZXMgaW5kZW50IFsxLDJdXG4gICAgZXNsaW50SW5kZW50T3B0aW9ucyAgPVxuICAgICAganN4SW5kZW50OiBbMSwxXSAgICAgICAgICAgICMgMSA9IGVuYWJsZWQsIDE9I3RhYnNcbiAgICAgIGpzeEluZGVudFByb3BzOiBbMSwxXSAgICAgICAjIDEgPSBlbmFibGVkLCAxPSN0YWJzXG4gICAgICBqc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uOiBbXG4gICAgICAgIDEsXG4gICAgICAgIHNlbGZDbG9zaW5nOiBUQUdBTElHTkVEXG4gICAgICAgIG5vbkVtcHR5OiBUQUdBTElHTkVEXG4gICAgICBdXG5cbiAgICByZXR1cm4gZXNsaW50SW5kZW50T3B0aW9ucyB1bmxlc3MgdHlwZW9mIGVzbGludFJ1bGVzIGlzIFwib2JqZWN0XCJcblxuICAgIEVTX0RFRkFVTFRfSU5ERU5UID0gNCAjIGRlZmF1bHQgZXNsaW50IGluZGVudCBhcyBzcGFjZXNcblxuICAgICMgcmVhZCBpbmRlbnQgaWYgaXQgZXhpc3RzIGFuZCB1c2UgaXQgYXMgdGhlIGRlZmF1bHQgaW5kZW50IGZvciBKU1hcbiAgICBydWxlID0gZXNsaW50UnVsZXNbJ2luZGVudCddXG4gICAgaWYgdHlwZW9mIHJ1bGUgaXMgJ251bWJlcicgb3IgdHlwZW9mIHJ1bGUgaXMgJ3N0cmluZydcbiAgICAgIGRlZmF1bHRJbmRlbnQgID0gRVNfREVGQVVMVF9JTkRFTlQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgZWxzZSBpZiB0eXBlb2YgcnVsZSBpcyAnb2JqZWN0J1xuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZGVmYXVsdEluZGVudCAgPSBydWxlWzFdIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgICAgZWxzZSBkZWZhdWx0SW5kZW50ICA9IDFcbiAgICBlbHNlIGRlZmF1bHRJbmRlbnQgID0gMVxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtaW5kZW50J11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMF0gPSBydWxlXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXSA9IEVTX0RFRkFVTFRfSU5ERU5UIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgIGVsc2UgaWYgdHlwZW9mIHJ1bGUgaXMgJ29iamVjdCdcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gPSBydWxlWzFdIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgICAgZWxzZSBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXSA9IDFcbiAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdID0gZGVmYXVsdEluZGVudFxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtaW5kZW50LXByb3BzJ11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXSA9IHJ1bGVcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV0gPSBFU19ERUZBVUxUX0lOREVOVCAvIEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBlbHNlIGlmIHR5cGVvZiBydWxlIGlzICdvYmplY3QnXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1sxXSA9IHJ1bGVbMV0gLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV0gPSAxXG4gICAgZWxzZSBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzFdID0gZGVmYXVsdEluZGVudFxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtY2xvc2luZy1icmFja2V0LWxvY2F0aW9uJ11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzBdID0gcnVsZVxuICAgIGVsc2UgaWYgdHlwZW9mIHJ1bGUgaXMgJ29iamVjdCcgIyBhcnJheVxuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ3N0cmluZydcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzFdLnNlbGZDbG9zaW5nID1cbiAgICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0ubm9uRW1wdHkgPVxuICAgICAgICAgICAgcnVsZVsxXVxuICAgICAgZWxzZVxuICAgICAgICBpZiBydWxlWzFdLnNlbGZDbG9zaW5nP1xuICAgICAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5zZWxmQ2xvc2luZyA9IHJ1bGVbMV0uc2VsZkNsb3NpbmdcbiAgICAgICAgaWYgcnVsZVsxXS5ub25FbXB0eT9cbiAgICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0ubm9uRW1wdHkgPSBydWxlWzFdLm5vbkVtcHR5XG5cbiAgICByZXR1cm4gZXNsaW50SW5kZW50T3B0aW9uc1xuXG4gICMgZG9lcyB0aGUgcHJldmlvdXMgbGluZSB0ZXJtaW5hdGUgd2l0aCBhIHRlcm5hcnkgZWxzZSA6XG4gIHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lOiAocm93KSAtPlxuICAgIHJvdy0tXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyByb3cgPj0wXG4gICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgbWF0Y2ggPSAvOlxccyokLy5leGVjKGxpbmUpXG4gICAgcmV0dXJuIGZhbHNlIGlmIG1hdGNoIGlzIG51bGxcbiAgICBzY29wZSA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgbWF0Y2guaW5kZXhdKS5nZXRTY29wZXNBcnJheSgpLnBvcCgpXG4gICAgcmV0dXJuIGZhbHNlIGlmIHNjb3BlIGlzbnQgJ2tleXdvcmQub3BlcmF0b3IudGVybmFyeS5qcydcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMgYWxsaWduIG5vbkVtcHR5IGFuZCBzZWxmQ2xvc2luZyB0YWdzIGJhc2VkIG9uIGVzbGludCBydWxlc1xuICAjIHJvdyB0byBiZSBpbmRlbnRlZCBiYXNlZCB1cG9uIGEgcGFyZW50VGFncyBwcm9wZXJ0aWVzIGFuZCBhIHJ1bGUgdHlwZVxuICAjIHJldHVybnMgaW5kZW50Um93J3MgcmV0dXJuIHZhbHVlXG4gIGluZGVudEZvckNsb3NpbmdCcmFja2V0OiAoIHJvdywgcGFyZW50VGFnLCBjbG9zaW5nQnJhY2tldFJ1bGUgKSAtPlxuICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMF1cbiAgICAgIGlmIGNsb3NpbmdCcmFja2V0UnVsZSBpcyBUQUdBTElHTkVEXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogcGFyZW50VGFnLnRva2VuSW5kZW50YXRpb259KVxuICAgICAgZWxzZSBpZiBjbG9zaW5nQnJhY2tldFJ1bGUgaXMgTElORUFMSUdORURcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcuZmlyc3RDaGFySW5kZW50YXRpb24gfSlcbiAgICAgIGVsc2UgaWYgY2xvc2luZ0JyYWNrZXRSdWxlIGlzIEFGVEVSUFJPUFNcbiAgICAgICAgIyB0aGlzIHJlYWxseSBpc24ndCB2YWxpZCBhcyB0aGlzIHRhZyBzaG91bGRuJ3QgYmUgb24gYSBsaW5lIGJ5IGl0c2VsZlxuICAgICAgICAjIGJ1dCBJIGRvbid0IHJlZm9ybWF0IGxpbmVzIGp1c3QgaW5kZW50IVxuICAgICAgICAjIGluZGVudCB0byBtYWtlIGl0IGxvb2sgT0sgYWx0aG91Z2ggaXQgd2lsbCBmYWlsIGVzbGludFxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50UHJvcHM6IDEgfSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy5maXJzdENoYXJJbmRlbnRhdGlvbn0pXG4gICAgICBlbHNlIGlmIGNsb3NpbmdCcmFja2V0UnVsZSBpcyBQUk9QU0FMSUdORURcbiAgICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMF1cbiAgICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcudG9rZW5JbmRlbnRhdGlvbixqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcudG9rZW5JbmRlbnRhdGlvbn0pXG5cbiAgIyBpbmRlbnQgYSByb3cgYnkgdGhlIGFkZGl0aW9uIG9mIG9uZSBvciBtb3JlIGluZGVudHMuXG4gICMgcmV0dXJucyBmYWxzZSBpZiBubyBpbmRlbnQgcmVxdWlyZWQgYXMgaXQgaXMgYWxyZWFkeSBjb3JyZWN0XG4gICMgcmV0dXJuIHRydWUgaWYgaW5kZW50IHdhcyByZXF1aXJlZFxuICAjIGJsb2NrSW5kZW50IGlzIHRoZSBpbmRlbnQgdG8gdGhlIHN0YXJ0IG9mIHRoaXMgbG9naWNhbCBqc3ggYmxvY2tcbiAgIyBvdGhlciBpbmRlbnRzIGFyZSB0aGUgcmVxdWlyZWQgaW5kZW50IGJhc2VkIG9uIGVzbGludCBjb25kaXRpb25zIGZvciBSZWFjdFxuICAjIG9wdGlvbiBjb250YWlucyByb3cgdG8gaW5kZW50IGFuZCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzIGZsYWdcbiAgaW5kZW50Um93OiAob3B0aW9ucykgLT5cbiAgICB7IHJvdywgYWxsb3dBZGRpdGlvbmFsSW5kZW50cywgYmxvY2tJbmRlbnQsIGpzeEluZGVudCwganN4SW5kZW50UHJvcHMgfSA9IG9wdGlvbnNcbiAgICBpZiBAdGVtcGxhdGVEZXB0aCA+IDAgdGhlbiByZXR1cm4gZmFsc2UgIyBkb24ndCBpbmRlbnQgaW5zaWRlIGEgdGVtcGxhdGVcbiAgICAjIGNhbGMgb3ZlcmFsbCBpbmRlbnRcbiAgICBpZiBqc3hJbmRlbnRcbiAgICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFswXVxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV1cbiAgICAgICAgICBibG9ja0luZGVudCArPSBqc3hJbmRlbnQgKiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV1cbiAgICBpZiBqc3hJbmRlbnRQcm9wc1xuICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMF1cbiAgICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV1cbiAgICAgICAgICBibG9ja0luZGVudCArPSBqc3hJbmRlbnRQcm9wcyAqIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzFdXG4gICAgIyBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzIGFsbG93cyBpbmRlbnRzIHRvIGJlIGdyZWF0ZXIgdGhhbiB0aGUgbWluaW11bVxuICAgICMgdXNlZCB3aGVyZSBpdGVtcyBhcmUgYWxpZ25lZCBidXQgbm8gZXNsaW50IHJ1bGVzIGFyZSBhcHBsaWNhYmxlXG4gICAgIyBzbyB1c2VyIGhhcyBzb21lIGRpc2NyZXRpb24gaW4gYWRkaW5nIG1vcmUgaW5kZW50c1xuICAgIGlmIGFsbG93QWRkaXRpb25hbEluZGVudHNcbiAgICAgIGlmIEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSA8IGJsb2NrSW5kZW50IG9yXG4gICAgICAgIEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSA+IGJsb2NrSW5kZW50ICsgYWxsb3dBZGRpdGlvbmFsSW5kZW50c1xuICAgICAgICAgIEBlZGl0b3Iuc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3cgcm93LCBibG9ja0luZGVudCwgeyBwcmVzZXJ2ZUxlYWRpbmdXaGl0ZXNwYWNlOiBmYWxzZSB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICBlbHNlXG4gICAgICBpZiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHJvdykgaXNudCBibG9ja0luZGVudFxuICAgICAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93IHJvdywgYmxvY2tJbmRlbnQsIHsgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZTogZmFsc2UgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxuIl19
