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
      this.JSXREGEXP = /(<)([$_A-Za-z](?:[$_.:\-A-Za-z0-9])*)|(\/>)|(<\/)([$_A-Za-z](?:[$._:\-A-Za-z0-9])*)(>)|(>)|({)|(})|(\?)|(:)|(if)|(else)|(case)|(default)|(return)|(\()|(\))|(`)|(?:(<)\s*(>))|(<\/)(>)/g;
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
        if ((match[1] != null) || (match[20] != null)) {
          return JSXTAG_OPEN;
        } else if (match[3] != null) {
          return JSXTAG_SELFCLOSE_END;
        }
      } else if ('JSXEndTagStart' === scope) {
        if ((match[4] != null) || (match[22] != null)) {
          return JSXTAG_CLOSE;
        }
      } else if ('JSXStartTagEnd' === scope) {
        if ((match[7] != null) || (match[21] != null)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1pbmRlbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw2ZkFBQTtJQUFBOzs7RUFBQSxNQUE0QyxPQUFBLENBQVEsTUFBUixDQUE1QyxFQUFDLDZDQUFELEVBQXNCLGVBQXRCLEVBQTRCLGlCQUE1QixFQUFtQzs7RUFDbkMsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxlQUFBLEdBQWtCLE9BQUEsQ0FBUSxxQkFBUjs7RUFDbEIsYUFBQSxHQUFnQixPQUFBLENBQVEsbUJBQVI7O0VBQ2hCLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSxxQkFBUjs7RUFDcEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSOztFQUdQLFFBQUEsR0FBMEI7O0VBQzFCLHNCQUFBLEdBQTBCOztFQUMxQixvQkFBQSxHQUEwQjs7RUFDMUIsV0FBQSxHQUEwQjs7RUFDMUIsa0JBQUEsR0FBMEI7O0VBQzFCLFlBQUEsR0FBMEI7O0VBQzFCLGFBQUEsR0FBMEI7O0VBQzFCLGNBQUEsR0FBMEI7O0VBQzFCLFVBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLFVBQUEsR0FBMEI7O0VBQzFCLFlBQUEsR0FBMEI7O0VBQzFCLEtBQUEsR0FBMEI7O0VBQzFCLE9BQUEsR0FBMEI7O0VBQzFCLGlCQUFBLEdBQTBCOztFQUMxQixrQkFBQSxHQUEwQjs7RUFDMUIsV0FBQSxHQUEwQjs7RUFDMUIsY0FBQSxHQUEwQjs7RUFDMUIsU0FBQSxHQUEwQjs7RUFDMUIsVUFBQSxHQUEwQjs7RUFDMUIsV0FBQSxHQUEwQjs7RUFDMUIsY0FBQSxHQUEwQjs7RUFDMUIsWUFBQSxHQUEwQjs7RUFHMUIsVUFBQSxHQUFnQjs7RUFDaEIsV0FBQSxHQUFn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QUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxHQUFoQyxDQUFBLEtBQTBDLFdBQTdDO1VBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQywwQkFBUixDQUFtQyxHQUFuQyxFQUF3QyxXQUF4QyxFQUFxRDtZQUFFLHlCQUFBLEVBQTJCLEtBQTdCO1dBQXJEO0FBQ0EsaUJBQU8sS0FGVDtTQU5GOztBQVNBLGFBQU87SUF4QkU7Ozs7O0FBbjBCYiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlLCBGaWxlLCBSYW5nZSwgUG9pbnR9ID0gcmVxdWlyZSAnYXRvbSdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuYXV0b0NvbXBsZXRlSlNYID0gcmVxdWlyZSAnLi9hdXRvLWNvbXBsZXRlLWpzeCdcbkRpZEluc2VydFRleHQgPSByZXF1aXJlICcuL2RpZC1pbnNlcnQtdGV4dCdcbnN0cmlwSnNvbkNvbW1lbnRzID0gcmVxdWlyZSAnc3RyaXAtanNvbi1jb21tZW50cydcbllBTUwgPSByZXF1aXJlICdqcy15YW1sJ1xuXG5cbk5PX1RPS0VOICAgICAgICAgICAgICAgID0gMFxuSlNYVEFHX1NFTEZDTE9TRV9TVEFSVCAgPSAxICAgICAgICMgdGhlIDx0YWcgaW4gPHRhZyAvPlxuSlNYVEFHX1NFTEZDTE9TRV9FTkQgICAgPSAyICAgICAgICMgdGhlIC8+IGluIDx0YWcgLz5cbkpTWFRBR19PUEVOICAgICAgICAgICAgID0gMyAgICAgICAjIHRoZSA8dGFnIGluIDx0YWc+PC90YWc+XG5KU1hUQUdfQ0xPU0VfQVRUUlMgICAgICA9IDQgICAgICAgIyB0aGUgMXN0ID4gaW4gPHRhZz48L3RhZz5cbkpTWFRBR19DTE9TRSAgICAgICAgICAgID0gNSAgICAgICAjIGEgPC90YWc+XG5KU1hCUkFDRV9PUEVOICAgICAgICAgICA9IDYgICAgICAgIyBlbWJlZGRlZCBleHByZXNzaW9uIGJyYWNlIHN0YXJ0IHtcbkpTWEJSQUNFX0NMT1NFICAgICAgICAgID0gNyAgICAgICAjIGVtYmVkZGVkIGV4cHJlc3Npb24gYnJhY2UgZW5kIH1cbkJSQUNFX09QRU4gICAgICAgICAgICAgID0gOCAgICAgICAjIEphdmFzY3JpcHQgYnJhY2VcbkJSQUNFX0NMT1NFICAgICAgICAgICAgID0gOSAgICAgICAjIEphdmFzY3JpcHQgYnJhY2VcblRFUk5BUllfSUYgICAgICAgICAgICAgID0gMTAgICAgICAjIFRlcm5hcnkgP1xuVEVSTkFSWV9FTFNFICAgICAgICAgICAgPSAxMSAgICAgICMgVGVybmFyeSA6XG5KU19JRiAgICAgICAgICAgICAgICAgICA9IDEyICAgICAgIyBKUyBJRlxuSlNfRUxTRSAgICAgICAgICAgICAgICAgPSAxMyAgICAgICMgSlMgRUxTRVxuU1dJVENIX0JSQUNFX09QRU4gICAgICAgPSAxNCAgICAgICMgb3BlbmluZyBicmFjZSBpbiBzd2l0Y2ggeyB9XG5TV0lUQ0hfQlJBQ0VfQ0xPU0UgICAgICA9IDE1ICAgICAgIyBjbG9zaW5nIGJyYWNlIGluIHN3aXRjaCB7IH1cblNXSVRDSF9DQVNFICAgICAgICAgICAgID0gMTYgICAgICAjIHN3aXRjaCBjYXNlIHN0YXRlbWVudFxuU1dJVENIX0RFRkFVTFQgICAgICAgICAgPSAxNyAgICAgICMgc3dpdGNoIGRlZmF1bHQgc3RhdGVtZW50XG5KU19SRVRVUk4gICAgICAgICAgICAgICA9IDE4ICAgICAgIyBKUyByZXR1cm5cblBBUkVOX09QRU4gICAgICAgICAgICAgID0gMTkgICAgICAjIHBhcmVuIG9wZW4gKFxuUEFSRU5fQ0xPU0UgICAgICAgICAgICAgPSAyMCAgICAgICMgcGFyZW4gY2xvc2UgKVxuVEVNUExBVEVfU1RBUlQgICAgICAgICAgPSAyMSAgICAgICMgYCBiYWNrLXRpY2sgc3RhcnRcblRFTVBMQVRFX0VORCAgICAgICAgICAgID0gMjIgICAgICAjIGAgYmFjay10aWNrIGVuZFxuXG4jIGVzbGludCBwcm9wZXJ0eSB2YWx1ZXNcblRBR0FMSUdORUQgICAgPSAndGFnLWFsaWduZWQnXG5MSU5FQUxJR05FRCAgID0gJ2xpbmUtYWxpZ25lZCdcbkFGVEVSUFJPUFMgICAgPSAnYWZ0ZXItcHJvcHMnXG5QUk9QU0FMSUdORUQgID0gJ3Byb3BzLWFsaWduZWQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEF1dG9JbmRlbnRcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuICAgIEBEaWRJbnNlcnRUZXh0ID0gbmV3IERpZEluc2VydFRleHQoQGVkaXRvcilcbiAgICBAYXV0b0pzeCA9IGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwnKS5hdXRvSW5kZW50SlNYXG4gICAgIyByZWdleCB0byBzZWFyY2ggZm9yIHRhZyBvcGVuL2Nsb3NlIHRhZyBhbmQgY2xvc2UgdGFnXG4gICAgQEpTWFJFR0VYUCA9IC8oPCkoWyRfQS1aYS16XSg/OlskXy46XFwtQS1aYS16MC05XSkqKXwoXFwvPil8KDxcXC8pKFskX0EtWmEtel0oPzpbJC5fOlxcLUEtWmEtejAtOV0pKikoPil8KD4pfCh7KXwofSl8KFxcPyl8KDopfChpZil8KGVsc2UpfChjYXNlKXwoZGVmYXVsdCl8KHJldHVybil8KFxcKCl8KFxcKSl8KGApfCg/Oig8KVxccyooPikpfCg8XFwvKSg+KS9nXG4gICAgQG1vdXNlVXAgPSB0cnVlXG4gICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlciA9IDFcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG4gICAgQHRlbXBsYXRlRGVwdGggPSAwICMgdHJhY2sgZGVwdGggb2YgYW55IGVtYmVkZGVkIGJhY2stdGljayB0ZW1wbGF0ZXNcblxuICAgICMgT2JzZXJ2ZSBhdXRvSW5kZW50SlNYIGZvciBleGlzdGluZyBlZGl0b3JzXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsYW5ndWFnZS1iYWJlbC5hdXRvSW5kZW50SlNYJyxcbiAgICAgICh2YWx1ZSkgPT4gQGF1dG9Kc3ggPSB2YWx1ZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6YXV0by1pbmRlbnQtanN4LW9uJzogKGV2ZW50KSA9PlxuICAgICAgICBAYXV0b0pzeCA9IHRydWVcbiAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdsYW5ndWFnZS1iYWJlbDphdXRvLWluZGVudC1qc3gtb2ZmJzogKGV2ZW50KSA9PiAgQGF1dG9Kc3ggPSBmYWxzZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6dG9nZ2xlLWF1dG8taW5kZW50LWpzeCc6IChldmVudCkgPT5cbiAgICAgICAgQGF1dG9Kc3ggPSBub3QgQGF1dG9Kc3hcbiAgICAgICAgaWYgQGF1dG9Kc3ggdGhlbiBAZXNsaW50SW5kZW50T3B0aW9ucyA9IEBnZXRJbmRlbnRPcHRpb25zKClcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiAoZXZlbnQpID0+IEBjaGFuZ2VkQ3Vyc29yUG9zaXRpb24oZXZlbnQpXG4gICAgQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nKClcblxuICBkZXN0cm95OiAoKSAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgIyBjaGFuZ2VkIGN1cnNvciBwb3NpdGlvblxuICBjaGFuZ2VkQ3Vyc29yUG9zaXRpb246IChldmVudCkgPT5cbiAgICByZXR1cm4gdW5sZXNzIEBhdXRvSnN4XG4gICAgcmV0dXJuIHVubGVzcyBAbW91c2VVcFxuICAgIHJldHVybiB1bmxlc3MgZXZlbnQub2xkQnVmZmVyUG9zaXRpb24ucm93IGlzbnQgZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgYnVmZmVyUm93ID0gZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgIyBoYW5kbGUgbXVsdGlwbGUgY3Vyc29ycy4gb25seSB0cmlnZ2VyIGluZGVudCBvbiBvbmUgY2hhbmdlIGV2ZW50XG4gICAgIyBhbmQgdGhlbiBvbmx5IGF0IHRoZSBoaWdoZXN0IHJvd1xuICAgIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICAgIGN1cnNvclBvc2l0aW9ucyA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcbiAgICAgIGlmIGN1cnNvclBvc2l0aW9ucy5sZW5ndGggaXMgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlclxuICAgICAgICBAbXVsdGlwbGVDdXJzb3JUcmlnZ2VyID0gMVxuICAgICAgICBidWZmZXJSb3cgPSAwXG4gICAgICAgIGZvciBjdXJzb3JQb3NpdGlvbiBpbiBjdXJzb3JQb3NpdGlvbnNcbiAgICAgICAgICBpZiBjdXJzb3JQb3NpdGlvbi5yb3cgPiBidWZmZXJSb3cgdGhlbiBidWZmZXJSb3cgPSBjdXJzb3JQb3NpdGlvbi5yb3dcbiAgICAgIGVsc2VcbiAgICAgICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlcisrXG4gICAgICAgIHJldHVyblxuICAgIGVsc2UgY3Vyc29yUG9zaXRpb24gPSBldmVudC5uZXdCdWZmZXJQb3NpdGlvblxuXG4gICAgIyByZW1vdmUgYW55IGJsYW5rIGxpbmVzIGZyb20gd2hlcmUgY3Vyc29yIHdhcyBwcmV2aW91c2x5XG4gICAgcHJldmlvdXNSb3cgPSBldmVudC5vbGRCdWZmZXJQb3NpdGlvbi5yb3dcbiAgICBpZiBAanN4SW5TY29wZShwcmV2aW91c1JvdylcbiAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwcmV2aW91c1JvdykpP1swXS5sZW5ndGhcbiAgICAgIGlmIGJsYW5rTGluZUVuZFBvcz9cbiAgICAgICAgQGluZGVudFJvdyh7cm93OiBwcmV2aW91c1JvdyAsIGJsb2NrSW5kZW50OiAwIH0pXG5cbiAgICByZXR1cm4gaWYgbm90IEBqc3hJblNjb3BlIGJ1ZmZlclJvd1xuXG4gICAgZW5kUG9pbnRPZkpzeCA9IG5ldyBQb2ludCBidWZmZXJSb3csMCAjIG5leHQgcm93IHN0YXJ0XG4gICAgc3RhcnRQb2ludE9mSnN4ID0gIGF1dG9Db21wbGV0ZUpTWC5nZXRTdGFydE9mSlNYIEBlZGl0b3IsIGN1cnNvclBvc2l0aW9uXG4gICAgQGluZGVudEpTWCBuZXcgUmFuZ2Uoc3RhcnRQb2ludE9mSnN4LCBlbmRQb2ludE9mSnN4KVxuICAgIGNvbHVtblRvTW92ZVRvID0gL15cXHMqJC8uZXhlYyhAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGJ1ZmZlclJvdykpP1swXS5sZW5ndGhcbiAgICBpZiBjb2x1bW5Ub01vdmVUbz8gdGhlbiBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFtidWZmZXJSb3csIGNvbHVtblRvTW92ZVRvXVxuXG5cbiAgIyBCdWZmZXIgaGFzIHN0b3BwZWQgY2hhbmdpbmcuIEluZGVudCBhcyByZXF1aXJlZFxuICBkaWRTdG9wQ2hhbmdpbmc6ICgpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYXV0b0pzeFxuICAgIHJldHVybiB1bmxlc3MgQG1vdXNlVXBcbiAgICBzZWxlY3RlZFJhbmdlID0gQGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICAjIGlmIHRoaXMgaXMgYSB0YWcgc3RhcnQncyBlbmQgPiBvciA8LyB0aGVuIGRvbid0IGF1dG8gaW5kZW50XG4gICAgIyB0aGlzIGlhIGZpeCB0byBhbGxvdyBmb3IgdGhlIGF1dG8gY29tcGxldGUgdGFnIHRpbWUgdG8gcG9wIHVwXG4gICAgaWYgc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3cgaXMgc2VsZWN0ZWRSYW5nZS5lbmQucm93IGFuZFxuICAgICAgc2VsZWN0ZWRSYW5nZS5zdGFydC5jb2x1bW4gaXMgc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uXG4gICAgICAgIHJldHVybiBpZiAnSlNYU3RhcnRUYWdFbmQnIGluIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3NlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLnN0YXJ0LmNvbHVtbl0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgcmV0dXJuIGlmICdKU1hFbmRUYWdTdGFydCcgaW4gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3csIHNlbGVjdGVkUmFuZ2Uuc3RhcnQuY29sdW1uXSkuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgaGlnaGVzdFJvdyA9IE1hdGgubWF4IHNlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLmVuZC5yb3dcbiAgICBsb3dlc3RSb3cgPSBNYXRoLm1pbiBzZWxlY3RlZFJhbmdlLnN0YXJ0LnJvdywgc2VsZWN0ZWRSYW5nZS5lbmQucm93XG5cbiAgICAjIHJlbW92ZSB0aGUgaGFuZGxlciBmb3IgZGlkU3RvcENoYW5naW5nIHRvIGF2b2lkIHRoaXMgY2hhbmdlIGNhdXNpbmcgYSBuZXcgZXZlbnRcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuXG4gICAgIyB3b3JrIGJhY2t3YXJkcyB0aHJvdWdoIGJ1ZmZlciByb3dzIGluZGVudGluZyBKU1ggYXMgbmVlZGVkXG4gICAgd2hpbGUgKCBoaWdoZXN0Um93ID49IGxvd2VzdFJvdyApXG4gICAgICBpZiBAanN4SW5TY29wZShoaWdoZXN0Um93KVxuICAgICAgICBlbmRQb2ludE9mSnN4ID0gbmV3IFBvaW50IGhpZ2hlc3RSb3csMFxuICAgICAgICBzdGFydFBvaW50T2ZKc3ggPSAgYXV0b0NvbXBsZXRlSlNYLmdldFN0YXJ0T2ZKU1ggQGVkaXRvciwgZW5kUG9pbnRPZkpzeFxuICAgICAgICBAaW5kZW50SlNYIG5ldyBSYW5nZShzdGFydFBvaW50T2ZKc3gsIGVuZFBvaW50T2ZKc3gpXG4gICAgICAgIGhpZ2hlc3RSb3cgPSBzdGFydFBvaW50T2ZKc3gucm93IC0gMVxuICAgICAgZWxzZSBoaWdoZXN0Um93ID0gaGlnaGVzdFJvdyAtIDFcblxuICAgICMgcmVuYWJsZSB0aGlzIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgMzAwbXMgYXMgcGVyIHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIGNoYW5nZSBldmVudHNcbiAgICAjIHRvIGF2b2lkIHRoaXMgbWV0aG9kIGJlaW5nIHJlY2FsbGVkIVxuICAgIHNldFRpbWVvdXQoQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nLCAzMDApXG4gICAgcmV0dXJuXG5cbiAgaGFuZGxlT25EaWRTdG9wQ2hhbmdpbmc6ID0+XG4gICAgQG9uRGlkU3RvcENoYW5naW5nSGFuZGxlciA9IEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgKCkgPT4gQGRpZFN0b3BDaGFuZ2luZygpXG5cbiAgIyBpcyB0aGUganN4IG9uIHRoaXMgbGluZSBpbiBzY29wZVxuICBqc3hJblNjb3BlOiAoYnVmZmVyUm93KSAtPlxuICAgIHNjb3BlcyA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgMF0pLmdldFNjb3Blc0FycmF5KClcbiAgICByZXR1cm4gJ21ldGEudGFnLmpzeCcgaW4gc2NvcGVzXG5cbiAgIyBpbmRlbnQgdGhlIEpTWCBpbiB0aGUgJ3JhbmdlJyBvZiByb3dzXG4gICMgVGhpcyBpcyBkZXNpZ25lZCB0byBiZSBhIHNpbmdsZSBwYXJzZSBpbmRlbnRlciB0byByZWR1Y2UgdGhlIGltcGFjdCBvbiB0aGUgZWRpdG9yLlxuICAjIEl0IGFzc3VtZXMgdGhlIGdyYW1tYXIgaGFzIGRvbmUgaXRzIGpvYiBhZGRpbmcgc2NvcGVzIHRvIGludGVyZXN0aW5nIHRva2Vucy5cbiAgIyBUaG9zZSBhcmUgSlNYIDx0YWcsID4sIDwvdGFnLCAvPiwgZW1lZGRlZCBleHByZXNzaW9uc1xuICAjIG91dHNpZGUgdGhlIHRhZyBzdGFydGluZyB7IGFuZCBlbmRpbmcgfSBhbmQgamF2YXNjcmlwdCBicmFjZXMgb3V0c2lkZSBhIHRhZyB7ICYgfVxuICAjIGl0IHVzZXMgYW4gYXJyYXkgdG8gaG9sZCB0b2tlbnMgYW5kIGEgcHVzaC9wb3Agc3RhY2sgdG8gaG9sZCB0b2tlbnMgbm90IGNsb3NlZFxuICAjIHRoZSB2ZXJ5IGZpcnN0IGpzeCB0YWcgbXVzdCBiZSBjb3JyZXRseSBpbmRldGVkIGJ5IHRoZSB1c2VyIGFzIHdlIGRvbid0IGhhdmVcbiAgIyBrbm93bGVkZ2Ugb2YgcHJlY2VlZGluZyBKYXZhc2NyaXB0LlxuICBpbmRlbnRKU1g6IChyYW5nZSkgLT5cbiAgICB0b2tlblN0YWNrID0gW11cbiAgICBpZHhPZlRva2VuID0gMFxuICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4gPSBbXSAjIGxlbmd0aCBlcXVpdmFsZW50IHRvIHRva2VuIGRlcHRoXG4gICAgaW5kZW50ID0gIDBcbiAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDBcbiAgICBAdGVtcGxhdGVEZXB0aCA9IDBcblxuICAgIGZvciByb3cgaW4gW3JhbmdlLnN0YXJ0LnJvdy4ucmFuZ2UuZW5kLnJvd11cbiAgICAgIGlzRmlyc3RUb2tlbk9mTGluZSA9IHRydWVcbiAgICAgIHRva2VuT25UaGlzTGluZSA9IGZhbHNlXG4gICAgICBpbmRlbnRSZWNhbGMgPSBmYWxzZVxuICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICAwXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcblxuICAgICAgIyBsb29rIGZvciB0b2tlbnMgaW4gYSBidWZmZXIgbGluZVxuICAgICAgd2hpbGUgKCggbWF0Y2ggPSBASlNYUkVHRVhQLmV4ZWMobGluZSkpIGlzbnQgbnVsbCApXG4gICAgICAgIG1hdGNoQ29sdW1uID0gbWF0Y2guaW5kZXhcbiAgICAgICAgbWF0Y2hQb2ludFN0YXJ0ID0gbmV3IFBvaW50KHJvdywgbWF0Y2hDb2x1bW4pXG4gICAgICAgIG1hdGNoUG9pbnRFbmQgPSBuZXcgUG9pbnQocm93LCBtYXRjaENvbHVtbiArIG1hdGNoWzBdLmxlbmd0aCAtIDEpXG4gICAgICAgIG1hdGNoUmFuZ2UgPSBuZXcgUmFuZ2UobWF0Y2hQb2ludFN0YXJ0LCBtYXRjaFBvaW50RW5kKVxuXG4gICAgICAgIGlmIHJvdyBpcyByYW5nZS5zdGFydC5yb3cgYW5kIG1hdGNoQ29sdW1uIDwgcmFuZ2Uuc3RhcnQuY29sdW1uIHRoZW4gY29udGludWVcbiAgICAgICAgaWYgbm90IHRva2VuID0gIEBnZXRUb2tlbihyb3csIG1hdGNoKSB0aGVuIGNvbnRpbnVlXG5cbiAgICAgICAgZmlyc3RDaGFySW5kZW50YXRpb24gPSAoQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyByb3cpXG4gICAgICAgICMgY29udmVydCB0aGUgbWF0Y2hlZCBjb2x1bW4gcG9zaXRpb24gaW50byB0YWIgaW5kZW50c1xuICAgICAgICBpZiBAZWRpdG9yLmdldFNvZnRUYWJzKClcbiAgICAgICAgICB0b2tlbkluZGVudGF0aW9uID0gKG1hdGNoQ29sdW1uIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKSlcbiAgICAgICAgZWxzZSB0b2tlbkluZGVudGF0aW9uID1cbiAgICAgICAgICBkbyAoQGVkaXRvcikgLT5cbiAgICAgICAgICAgIGhhcmRUYWJzRm91bmQgPSBjaGFyc0ZvdW5kID0gMFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5tYXRjaENvbHVtbl1cbiAgICAgICAgICAgICAgaWYgKChsaW5lLnN1YnN0ciBpLCAxKSBpcyAnXFx0JylcbiAgICAgICAgICAgICAgICBoYXJkVGFic0ZvdW5kKytcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNoYXJzRm91bmQrK1xuICAgICAgICAgICAgcmV0dXJuIGhhcmRUYWJzRm91bmQgKyAoIGNoYXJzRm91bmQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpIClcblxuICAgICAgICAjIGJpZyBzd2l0Y2ggc3RhdGVtZW50IGZvbGxvd3MgZm9yIGVhY2ggdG9rZW4uIElmIHRoZSBsaW5lIGlzIHJlZm9ybWF0ZWRcbiAgICAgICAgIyB0aGVuIHdlIHJlY2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICAgICMgYml0IGhvcnJpZCBidXQgaG9wZWZ1bGx5IGZhc3QuXG4gICAgICAgIHN3aXRjaCAodG9rZW4pXG4gICAgICAgICAgIyB0YWdzIHN0YXJ0aW5nIDx0YWdcbiAgICAgICAgICB3aGVuIEpTWFRBR19PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICAjIGluZGVudCBvbmx5IG9uIGZpcnN0IHRva2VuIG9mIGEgbGluZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgIyBpc0ZpcnN0VGFnT2ZCbG9jayBpcyB1c2VkIHRvIG1hcmsgdGhlIHRhZyB0aGF0IHN0YXJ0cyB0aGUgSlNYIGJ1dFxuICAgICAgICAgICAgICAjIGFsc28gdGhlIGZpcnN0IHRhZyBvZiBibG9ja3MgaW5zaWRlICBlbWJlZGRlZCBleHByZXNzaW9ucy4gZS5nLlxuICAgICAgICAgICAgICAjIDx0Ym9keT4sIDxwQ29tcD4gYW5kIDxvYmplY3RSb3c+IGFyZSBmaXJzdCB0YWdzXG4gICAgICAgICAgICAgICMgcmV0dXJuIChcbiAgICAgICAgICAgICAgIyAgICAgICA8dGJvZHkgY29tcD17PHBDb21wIHByb3BlcnR5IC8+fT5cbiAgICAgICAgICAgICAgIyAgICAgICAgIHtvYmplY3RzLm1hcChmdW5jdGlvbihvYmplY3QsIGkpe1xuICAgICAgICAgICAgICAjICAgICAgICAgICByZXR1cm4gPE9iamVjdFJvdyBvYmo9e29iamVjdH0ga2V5PXtpfSAvPjtcbiAgICAgICAgICAgICAgIyAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAjICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICMgICAgIClcbiAgICAgICAgICAgICAgIyBidXQgd2UgZG9uJ3QgcG9zaXRpb24gdGhlIDx0Ym9keT4gYXMgd2UgaGF2ZSBubyBrbm93bGVkZ2Ugb2YgdGhlIHByZWNlZWRpbmdcbiAgICAgICAgICAgICAgIyBqcyBzeW50YXhcbiAgICAgICAgICAgICAgaWYgaXNGaXJzdFRhZ09mQmxvY2sgYW5kXG4gICAgICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeD8gYW5kXG4gICAgICAgICAgICAgICAgICAoIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgQlJBQ0VfT1BFTiBvclxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hCUkFDRV9PUEVOIClcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgICBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gKyB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZCBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93ICwgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDF9KVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX09QRU5cbiAgICAgICAgICAgICAgbmFtZTogbWF0Y2hbMl1cbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyA8L3RhZz5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRVxuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFXG4gICAgICAgICAgICAgIG5hbWU6IG1hdGNoWzVdXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIHBhcmVudFRva2VuSWR4OiBwYXJlbnRUb2tlbklkeCAgICAgICAgICMgcHRyIHRvIDx0YWdcbiAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4ID49MCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyAvPlxuICAgICAgICAgIHdoZW4gSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICNpZiBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uIGlzIGZpcnN0Q2hhckluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRGb3JDbG9zaW5nQnJhY2tldCAgcm93LFxuICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLFxuICAgICAgICAgICAgICAgIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0uc2VsZkNsb3NpbmdcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgICAgbmFtZTogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0ubmFtZVxuICAgICAgICAgICAgICByb3c6IHJvd1xuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHggICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMFxuICAgICAgICAgICAgICB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSA9IEpTWFRBR19TRUxGQ0xPU0VfU1RBUlRcbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIHRhZ3MgZW5kaW5nID5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRV9BVFRSU1xuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgI2lmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb24gaXMgZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudEZvckNsb3NpbmdCcmFja2V0ICByb3csXG4gICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0sXG4gICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5ub25FbXB0eVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IGZhbHNlXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgICAgICAgICAgIG5hbWU6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLm5hbWVcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIGVtYmVkZWQgZXhwcmVzc2lvbiBzdGFydCB7XG4gICAgICAgICAgd2hlbiBKU1hCUkFDRV9PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIEpTWFRBR19PUEVOIGFuZCB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxfSApXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0ZXJuYXJ5IHN0YXJ0XG4gICAgICAgICAgd2hlbiBURVJOQVJZX0lGXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgIyBpcyB0aGlzIHRlcm5hcnkgc3RhcnRpbmcgYSBuZXcgbGluZVxuICAgICAgICAgICAgICBpZiBmaXJzdENoYXJJbmRlbnRhdGlvbiBpcyB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hUQUdfT1BFTiBhbmQgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHggaXMgbnVsbFxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMX0gKVxuXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBlbWJlZGVkIGV4cHJlc3Npb24gZW5kIH1cbiAgICAgICAgICB3aGVuIEpTWEJSQUNFX0NMT1NFLCBURVJOQVJZX0VMU0VcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcblxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuXG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gb3BlbmluZyB0b2tlblxuXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBTdGFydCB7IG9yIHN3aXRjaCBicmFjZSBzdGFydCB7IG9yIHBhcmVuICggb3IgYmFjay10aWNrIGBzdGFydFxuICAgICAgICAgIHdoZW4gQlJBQ0VfT1BFTiwgU1dJVENIX0JSQUNFX09QRU4sIFBBUkVOX09QRU4sIFRFTVBMQVRFX1NUQVJUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9TVEFSVCB0aGVuIEB0ZW1wbGF0ZURlcHRoKytcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZFxuICAgICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg/IGFuZFxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyB0b2tlbiBhbmRcbiAgICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnJvdyBpcyAoIHJvdyAtIDEpXG4gICAgICAgICAgICAgICAgICAgIHRva2VuSW5kZW50YXRpb24gPSBmaXJzdENoYXJJbmRlbnRhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdICsgQGdldEluZGVudE9mUHJldmlvdXNSb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogZmlyc3RDaGFySW5kZW50YXRpb259KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgIHR5cGU6IHRva2VuXG4gICAgICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb246IGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgdG9rZW5JbmRlbnRhdGlvbjogdG9rZW5JbmRlbnRhdGlvblxuICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbjogZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4XG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4OiBudWxsICAjIHB0ciB0byA+IHRhZ1xuICAgICAgICAgICAgICB0ZXJtc1RoaXNUYWdJZHg6IG51bGwgICAgICAgICAgICAgIyBwdHIgdG8gPC90YWc+XG5cbiAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBFbmQgfSBvciBzd2l0Y2ggYnJhY2UgZW5kIH0gb3IgcGFyZW4gY2xvc2UgKSBvciBiYWNrLXRpY2sgYCBlbmRcbiAgICAgICAgICB3aGVuIEJSQUNFX0NMT1NFLCBTV0lUQ0hfQlJBQ0VfQ0xPU0UsIFBBUkVOX0NMT1NFLCBURU1QTEFURV9FTkRcblxuICAgICAgICAgICAgaWYgdG9rZW4gaXMgU1dJVENIX0JSQUNFX0NMT1NFXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfQ0FTRSBvciB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAjIHNvIG5vdyB3ZSBhcmUgYXQgdGhlIHN3aXRjaCdzIGNsb3NlIGJyYWNlIHdlIHBvcCBvZmYgYW55IGNhc2UvZGVmYXVsdCB0b2tlbnNcbiAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG5cbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24gfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9FTkQgdGhlbiBAdGVtcGxhdGVEZXB0aC0tXG5cbiAgICAgICAgICAjIGNhc2UsIGRlZmF1bHQgc3RhdGVtZW50IG9mIHN3aXRjaFxuICAgICAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGlmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgU1dJVENIX0NBU0Ugb3IgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfREVGQVVMVFxuICAgICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICMgc28gcG9zaXRpb24gbmV3IGNhc2UvZGVmYXVsdCB0byB0aGUgbGFzdCBvbmVzIHBvc2l0aW9uIGFuZCB0aGVuIHBvcCB0aGUgbGFzdCdzXG4gICAgICAgICAgICAgICAgICAjIG9mZiB0aGUgc3RhY2suXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uIH0pXG4gICAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9CUkFDRV9PUEVOXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBUZXJuYXJ5IGFuZCBjb25kaXRpb25hbCBpZi9lbHNlIG9wZXJhdG9yc1xuICAgICAgICAgIHdoZW4gSlNfSUYsIEpTX0VMU0UsIEpTX1JFVFVSTlxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSB0cnVlXG5cbiAgICAgICMgaGFuZGxlIGxpbmVzIHdpdGggbm8gdG9rZW4gb24gdGhlbVxuICAgICAgaWYgaWR4T2ZUb2tlbiBhbmQgbm90IHRva2VuT25UaGlzTGluZVxuICAgICAgICAjIGluZGVudCBsaW5lcyBidXQgcmVtb3ZlIGFueSBibGFuayBsaW5lcyB3aXRoIHdoaXRlIHNwYWNlIGV4Y2VwdCB0aGUgbGFzdCByb3dcbiAgICAgICAgaWYgcm93IGlzbnQgcmFuZ2UuZW5kLnJvd1xuICAgICAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKT9bMF0ubGVuZ3RoXG4gICAgICAgICAgaWYgYmxhbmtMaW5lRW5kUG9zP1xuICAgICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3cgLCBibG9ja0luZGVudDogMCB9KVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmRlbnRVbnRva2VuaXNlZExpbmUgcm93LCB0b2tlblN0YWNrLCBzdGFja09mVG9rZW5zU3RpbGxPcGVuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaW5kZW50VW50b2tlbmlzZWRMaW5lIHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlblxuXG5cbiAgIyBpbmRlbnQgYW55IGxpbmVzIHRoYXQgaGF2ZW4ndCBhbnkgaW50ZXJlc3RpbmcgdG9rZW5zXG4gIGluZGVudFVudG9rZW5pc2VkTGluZTogKHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlbiApIC0+XG4gICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgIHJldHVybiBpZiBub3QgcGFyZW50VG9rZW5JZHg/XG4gICAgdG9rZW4gPSB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XVxuICAgIHN3aXRjaCB0b2tlbi50eXBlXG4gICAgICB3aGVuIEpTWFRBR19PUEVOLCBKU1hUQUdfU0VMRkNMT1NFX1NUQVJUXG4gICAgICAgIGlmICB0b2tlbi50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlbi5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50UHJvcHM6IDEgfSlcbiAgICAgICAgZWxzZSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcbiAgICAgIHdoZW4gSlNYQlJBQ0VfT1BFTiwgVEVSTkFSWV9JRlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBCUkFDRV9PUEVOLCBTV0lUQ0hfQlJBQ0VfT1BFTiwgUEFSRU5fT1BFTlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBKU1hUQUdfU0VMRkNMT1NFX0VORCwgSlNYQlJBQ0VfQ0xPU0UsIEpTWFRBR19DTE9TRV9BVFRSUywgVEVSTkFSWV9FTFNFXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1t0b2tlbi5wYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudFByb3BzOiAxfSlcbiAgICAgIHdoZW4gQlJBQ0VfQ0xPU0UsIFNXSVRDSF9CUkFDRV9DTE9TRSwgUEFSRU5fQ0xPU0VcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3Rva2VuLnBhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxLCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzOiB0cnVlfSlcbiAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW4uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9KVxuICAgICAgd2hlbiBURU1QTEFURV9TVEFSVCwgVEVNUExBVEVfRU5EXG4gICAgICAgIHJldHVybjsgIyBkb24ndCB0b3VjaCB0ZW1wbGF0ZXNcblxuICAjIGdldCB0aGUgdG9rZW4gYXQgdGhlIGdpdmVuIG1hdGNoIHBvc2l0aW9uIG9yIHJldHVybiB0cnV0aHkgZmFsc2VcbiAgZ2V0VG9rZW46IChidWZmZXJSb3csIG1hdGNoKSAtPlxuICAgIHNjb3BlID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUm93LCBtYXRjaC5pbmRleF0pLmdldFNjb3Blc0FycmF5KCkucG9wKClcbiAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi50YWcuanN4JyBpcyBzY29wZVxuICAgICAgaWYgICAgICBtYXRjaFsxXT8gb3IgbWF0Y2hbMjBdPyB0aGVuIHJldHVybiBKU1hUQUdfT1BFTlxuICAgICAgZWxzZSBpZiBtYXRjaFszXT8gdGhlbiByZXR1cm4gSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICBlbHNlIGlmICdKU1hFbmRUYWdTdGFydCcgaXMgc2NvcGVcbiAgICAgIGlmIG1hdGNoWzRdPyBvciBtYXRjaFsyMl0/IHRoZW4gcmV0dXJuIEpTWFRBR19DTE9TRVxuICAgIGVsc2UgaWYgJ0pTWFN0YXJ0VGFnRW5kJyBpcyBzY29wZVxuICAgICAgaWYgbWF0Y2hbN10/IG9yIG1hdGNoWzIxXT8gdGhlbiByZXR1cm4gSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgZWxzZSBpZiBtYXRjaFs4XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmJlZ2luLmpzeCcgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIEpTWEJSQUNFX09QRU5cbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuc3dpdGNoU3RhcnQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfT1BFTlxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5qcycgaXMgc2NvcGUgb3JcbiAgICAgICAgJ21ldGEuYnJhY2UuY3VybHkubGl0b2JqLmpzJyBpcyBzY29wZVxuICAgICAgICAgIHJldHVybiBCUkFDRV9PUEVOXG4gICAgZWxzZSBpZiBtYXRjaFs5XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmVuZC5qc3gnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU1hCUkFDRV9DTE9TRVxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5zd2l0Y2hFbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfQ0xPU0VcbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuanMnIGlzIHNjb3BlIG9yXG4gICAgICAgICdtZXRhLmJyYWNlLmN1cmx5LmxpdG9iai5qcycgaXMgc2NvcGVcbiAgICAgICAgICByZXR1cm4gQlJBQ0VfQ0xPU0VcbiAgICBlbHNlIGlmIG1hdGNoWzEwXT9cbiAgICAgIGlmICdrZXl3b3JkLm9wZXJhdG9yLnRlcm5hcnkuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURVJOQVJZX0lGXG4gICAgZWxzZSBpZiBtYXRjaFsxMV0/XG4gICAgICBpZiAna2V5d29yZC5vcGVyYXRvci50ZXJuYXJ5LmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gVEVSTkFSWV9FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxMl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmNvbmRpdGlvbmFsLmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gSlNfSUZcbiAgICBlbHNlIGlmIG1hdGNoWzEzXT9cbiAgICAgIGlmICdrZXl3b3JkLmNvbnRyb2wuY29uZGl0aW9uYWwuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNF0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9DQVNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNV0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9ERUZBVUxUXG4gICAgZWxzZSBpZiBtYXRjaFsxNl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmZsb3cuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19SRVRVUk5cbiAgICBlbHNlIGlmIG1hdGNoWzE3XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX09QRU5cbiAgICBlbHNlIGlmIG1hdGNoWzE4XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX0NMT1NFXG4gICAgZWxzZSBpZiBtYXRjaFsxOV0/XG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5iZWdpbi5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFRFTVBMQVRFX1NUQVJUXG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5lbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURU1QTEFURV9FTkRcblxuICAgIHJldHVybiBOT19UT0tFTlxuXG5cbiAgIyBnZXQgaW5kZW50IG9mIHRoZSBwcmV2aW91cyByb3cgd2l0aCBjaGFycyBpbiBpdFxuICBnZXRJbmRlbnRPZlByZXZpb3VzUm93OiAocm93KSAtPlxuICAgIHJldHVybiAwIHVubGVzcyByb3dcbiAgICBmb3Igcm93IGluIFtyb3ctMS4uLjBdXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgIHJldHVybiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93IHJvdyBpZiAgLy4qXFxTLy50ZXN0IGxpbmVcbiAgICByZXR1cm4gMFxuXG4gICMgZ2V0IGVzbGludCB0cmFuc2xhdGVkIGluZGVudCBvcHRpb25zXG4gIGdldEluZGVudE9wdGlvbnM6ICgpIC0+XG4gICAgaWYgbm90IEBhdXRvSnN4IHRoZW4gcmV0dXJuIEB0cmFuc2xhdGVJbmRlbnRPcHRpb25zKClcbiAgICBpZiBlc2xpbnRyY0ZpbGVuYW1lID0gQGdldEVzbGludHJjRmlsZW5hbWUoKVxuICAgICAgZXNsaW50cmNGaWxlbmFtZSA9IG5ldyBGaWxlKGVzbGludHJjRmlsZW5hbWUpXG4gICAgICBAdHJhbnNsYXRlSW5kZW50T3B0aW9ucyhAcmVhZEVzbGludHJjT3B0aW9ucyhlc2xpbnRyY0ZpbGVuYW1lLmdldFBhdGgoKSkpXG4gICAgZWxzZVxuICAgICAgQHRyYW5zbGF0ZUluZGVudE9wdGlvbnMoe30pICMgZ2V0IGRlZmF1bHRzXG5cbiAgIyByZXR1cm4gdGV4dCBzdHJpbmcgb2YgYSBwcm9qZWN0IGJhc2VkIC5lc2xpbnRyYyBmaWxlIGlmIG9uZSBleGlzdHNcbiAgZ2V0RXNsaW50cmNGaWxlbmFtZTogKCkgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBAZWRpdG9yLmdldFBhdGgoKVxuICAgICMgSXMgdGhlIHNvdXJjZUZpbGUgbG9jYXRlZCBpbnNpZGUgYW4gQXRvbSBwcm9qZWN0IGZvbGRlcj9cbiAgICBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXT9cbiAgICAgIHBhdGguam9pbiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSwgJy5lc2xpbnRyYydcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VEb3duOiAoKSA9PlxuICAgIEBtb3VzZVVwID0gZmFsc2VcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VVcDogKCkgPT5cbiAgICBAbW91c2VVcCA9IHRydWVcblxuICAjIHRvIGNyZWF0ZSBpbmRlbnRzLiBXZSBjYW4gcmVhZCBhbmQgcmV0dXJuIHRoZSBydWxlcyBwcm9wZXJ0aWVzIG9yIHVuZGVmaW5lZFxuICByZWFkRXNsaW50cmNPcHRpb25zOiAoZXNsaW50cmNGaWxlKSAtPlxuICAgICMgZ2V0IGxvY2FsIHBhdGggb3ZlcmlkZXNcbiAgICBpZiBmcy5leGlzdHNTeW5jIGVzbGludHJjRmlsZVxuICAgICAgZmlsZUNvbnRlbnQgPSBzdHJpcEpzb25Db21tZW50cyhmcy5yZWFkRmlsZVN5bmMoZXNsaW50cmNGaWxlLCAndXRmOCcpKVxuICAgICAgdHJ5XG4gICAgICAgIGVzbGludFJ1bGVzID0gKFlBTUwuc2FmZUxvYWQgZmlsZUNvbnRlbnQpLnJ1bGVzXG4gICAgICAgIGlmIGVzbGludFJ1bGVzIHRoZW4gcmV0dXJuIGVzbGludFJ1bGVzXG4gICAgICBjYXRjaCBlcnJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiTEI6IEVycm9yIHJlYWRpbmcgLmVzbGludHJjIGF0ICN7ZXNsaW50cmNGaWxlfVwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgZGV0YWlsOiBcIiN7ZXJyLm1lc3NhZ2V9XCJcbiAgICByZXR1cm4ge31cblxuICAjIHVzZSBlc2xpbnQgcmVhY3QgZm9ybWF0IGRlc2NyaWJlZCBhdCBodHRwOi8vdGlueXVybC5jb20vcDRtdGF0dlxuICAjIHR1cm4gc3BhY2VzIGludG8gdGFiIGRpbWVuc2lvbnMgd2hpY2ggY2FuIGJlIGRlY2ltYWxcbiAgIyBhIGVtcHR5IG9iamVjdCBhcmd1bWVudCBwYXJzZXMgYmFjayB0aGUgZGVmYXVsdCBzZXR0aW5nc1xuICB0cmFuc2xhdGVJbmRlbnRPcHRpb25zOiAoZXNsaW50UnVsZXMpIC0+XG4gICAgIyBFc2xpbnQgcnVsZXMgdG8gdXNlIGFzIGRlZmF1bHQgb3ZlcmlkZGVuIGJ5IC5lc2xpbnRyY1xuICAgICMgTi5CLiB0aGF0IHRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHRoZSBlc2xpbnQgcnVsZXMgaW4gdGhhdFxuICAgICMgdGhlIHRhYi1zcGFjZXMgYW5kICd0YWIncyBpbiBlc2xpbnRyYyBhcmUgY29udmVydGVkIHRvIHRhYnMgYmFzZWQgdXBvblxuICAgICMgdGhlIEF0b20gZWRpdG9yIHRhYiBzcGFjaW5nLlxuICAgICMgZS5nLiBlc2xpbnQgaW5kZW50IFsxLDRdIHdpdGggYW4gQXRvbSB0YWIgc3BhY2luZyBvZiAyIGJlY29tZXMgaW5kZW50IFsxLDJdXG4gICAgZXNsaW50SW5kZW50T3B0aW9ucyAgPVxuICAgICAganN4SW5kZW50OiBbMSwxXSAgICAgICAgICAgICMgMSA9IGVuYWJsZWQsIDE9I3RhYnNcbiAgICAgIGpzeEluZGVudFByb3BzOiBbMSwxXSAgICAgICAjIDEgPSBlbmFibGVkLCAxPSN0YWJzXG4gICAgICBqc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uOiBbXG4gICAgICAgIDEsXG4gICAgICAgIHNlbGZDbG9zaW5nOiBUQUdBTElHTkVEXG4gICAgICAgIG5vbkVtcHR5OiBUQUdBTElHTkVEXG4gICAgICBdXG5cbiAgICByZXR1cm4gZXNsaW50SW5kZW50T3B0aW9ucyB1bmxlc3MgdHlwZW9mIGVzbGludFJ1bGVzIGlzIFwib2JqZWN0XCJcblxuICAgIEVTX0RFRkFVTFRfSU5ERU5UID0gNCAjIGRlZmF1bHQgZXNsaW50IGluZGVudCBhcyBzcGFjZXNcblxuICAgICMgcmVhZCBpbmRlbnQgaWYgaXQgZXhpc3RzIGFuZCB1c2UgaXQgYXMgdGhlIGRlZmF1bHQgaW5kZW50IGZvciBKU1hcbiAgICBydWxlID0gZXNsaW50UnVsZXNbJ2luZGVudCddXG4gICAgaWYgdHlwZW9mIHJ1bGUgaXMgJ251bWJlcicgb3IgdHlwZW9mIHJ1bGUgaXMgJ3N0cmluZydcbiAgICAgIGRlZmF1bHRJbmRlbnQgID0gRVNfREVGQVVMVF9JTkRFTlQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgZWxzZSBpZiB0eXBlb2YgcnVsZSBpcyAnb2JqZWN0J1xuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZGVmYXVsdEluZGVudCAgPSBydWxlWzFdIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgICAgZWxzZSBkZWZhdWx0SW5kZW50ICA9IDFcbiAgICBlbHNlIGRlZmF1bHRJbmRlbnQgID0gMVxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtaW5kZW50J11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMF0gPSBydWxlXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXSA9IEVTX0RFRkFVTFRfSU5ERU5UIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgIGVsc2UgaWYgdHlwZW9mIHJ1bGUgaXMgJ29iamVjdCdcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gPSBydWxlWzFdIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgICAgZWxzZSBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXSA9IDFcbiAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdID0gZGVmYXVsdEluZGVudFxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtaW5kZW50LXByb3BzJ11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXSA9IHJ1bGVcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV0gPSBFU19ERUZBVUxUX0lOREVOVCAvIEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBlbHNlIGlmIHR5cGVvZiBydWxlIGlzICdvYmplY3QnXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ251bWJlcidcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1sxXSA9IHJ1bGVbMV0gLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV0gPSAxXG4gICAgZWxzZSBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzFdID0gZGVmYXVsdEluZGVudFxuXG4gICAgcnVsZSA9IGVzbGludFJ1bGVzWydyZWFjdC9qc3gtY2xvc2luZy1icmFja2V0LWxvY2F0aW9uJ11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzBdID0gcnVsZVxuICAgIGVsc2UgaWYgdHlwZW9mIHJ1bGUgaXMgJ29iamVjdCcgIyBhcnJheVxuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzBdID0gcnVsZVswXVxuICAgICAgaWYgdHlwZW9mIHJ1bGVbMV0gaXMgJ3N0cmluZydcbiAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzFdLnNlbGZDbG9zaW5nID1cbiAgICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0ubm9uRW1wdHkgPVxuICAgICAgICAgICAgcnVsZVsxXVxuICAgICAgZWxzZVxuICAgICAgICBpZiBydWxlWzFdLnNlbGZDbG9zaW5nP1xuICAgICAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5zZWxmQ2xvc2luZyA9IHJ1bGVbMV0uc2VsZkNsb3NpbmdcbiAgICAgICAgaWYgcnVsZVsxXS5ub25FbXB0eT9cbiAgICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0ubm9uRW1wdHkgPSBydWxlWzFdLm5vbkVtcHR5XG5cbiAgICByZXR1cm4gZXNsaW50SW5kZW50T3B0aW9uc1xuXG4gICMgZG9lcyB0aGUgcHJldmlvdXMgbGluZSB0ZXJtaW5hdGUgd2l0aCBhIHRlcm5hcnkgZWxzZSA6XG4gIHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lOiAocm93KSAtPlxuICAgIHJvdy0tXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyByb3cgPj0wXG4gICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgbWF0Y2ggPSAvOlxccyokLy5leGVjKGxpbmUpXG4gICAgcmV0dXJuIGZhbHNlIGlmIG1hdGNoIGlzIG51bGxcbiAgICBzY29wZSA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3JvdywgbWF0Y2guaW5kZXhdKS5nZXRTY29wZXNBcnJheSgpLnBvcCgpXG4gICAgcmV0dXJuIGZhbHNlIGlmIHNjb3BlIGlzbnQgJ2tleXdvcmQub3BlcmF0b3IudGVybmFyeS5qcydcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMgYWxsaWduIG5vbkVtcHR5IGFuZCBzZWxmQ2xvc2luZyB0YWdzIGJhc2VkIG9uIGVzbGludCBydWxlc1xuICAjIHJvdyB0byBiZSBpbmRlbnRlZCBiYXNlZCB1cG9uIGEgcGFyZW50VGFncyBwcm9wZXJ0aWVzIGFuZCBhIHJ1bGUgdHlwZVxuICAjIHJldHVybnMgaW5kZW50Um93J3MgcmV0dXJuIHZhbHVlXG4gIGluZGVudEZvckNsb3NpbmdCcmFja2V0OiAoIHJvdywgcGFyZW50VGFnLCBjbG9zaW5nQnJhY2tldFJ1bGUgKSAtPlxuICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMF1cbiAgICAgIGlmIGNsb3NpbmdCcmFja2V0UnVsZSBpcyBUQUdBTElHTkVEXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogcGFyZW50VGFnLnRva2VuSW5kZW50YXRpb259KVxuICAgICAgZWxzZSBpZiBjbG9zaW5nQnJhY2tldFJ1bGUgaXMgTElORUFMSUdORURcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcuZmlyc3RDaGFySW5kZW50YXRpb24gfSlcbiAgICAgIGVsc2UgaWYgY2xvc2luZ0JyYWNrZXRSdWxlIGlzIEFGVEVSUFJPUFNcbiAgICAgICAgIyB0aGlzIHJlYWxseSBpc24ndCB2YWxpZCBhcyB0aGlzIHRhZyBzaG91bGRuJ3QgYmUgb24gYSBsaW5lIGJ5IGl0c2VsZlxuICAgICAgICAjIGJ1dCBJIGRvbid0IHJlZm9ybWF0IGxpbmVzIGp1c3QgaW5kZW50IVxuICAgICAgICAjIGluZGVudCB0byBtYWtlIGl0IGxvb2sgT0sgYWx0aG91Z2ggaXQgd2lsbCBmYWlsIGVzbGludFxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50UHJvcHM6IDEgfSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy5maXJzdENoYXJJbmRlbnRhdGlvbn0pXG4gICAgICBlbHNlIGlmIGNsb3NpbmdCcmFja2V0UnVsZSBpcyBQUk9QU0FMSUdORURcbiAgICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMF1cbiAgICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcudG9rZW5JbmRlbnRhdGlvbixqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcudG9rZW5JbmRlbnRhdGlvbn0pXG5cbiAgIyBpbmRlbnQgYSByb3cgYnkgdGhlIGFkZGl0aW9uIG9mIG9uZSBvciBtb3JlIGluZGVudHMuXG4gICMgcmV0dXJucyBmYWxzZSBpZiBubyBpbmRlbnQgcmVxdWlyZWQgYXMgaXQgaXMgYWxyZWFkeSBjb3JyZWN0XG4gICMgcmV0dXJuIHRydWUgaWYgaW5kZW50IHdhcyByZXF1aXJlZFxuICAjIGJsb2NrSW5kZW50IGlzIHRoZSBpbmRlbnQgdG8gdGhlIHN0YXJ0IG9mIHRoaXMgbG9naWNhbCBqc3ggYmxvY2tcbiAgIyBvdGhlciBpbmRlbnRzIGFyZSB0aGUgcmVxdWlyZWQgaW5kZW50IGJhc2VkIG9uIGVzbGludCBjb25kaXRpb25zIGZvciBSZWFjdFxuICAjIG9wdGlvbiBjb250YWlucyByb3cgdG8gaW5kZW50IGFuZCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzIGZsYWdcbiAgaW5kZW50Um93OiAob3B0aW9ucykgLT5cbiAgICB7IHJvdywgYWxsb3dBZGRpdGlvbmFsSW5kZW50cywgYmxvY2tJbmRlbnQsIGpzeEluZGVudCwganN4SW5kZW50UHJvcHMgfSA9IG9wdGlvbnNcbiAgICBpZiBAdGVtcGxhdGVEZXB0aCA+IDAgdGhlbiByZXR1cm4gZmFsc2UgIyBkb24ndCBpbmRlbnQgaW5zaWRlIGEgdGVtcGxhdGVcbiAgICAjIGNhbGMgb3ZlcmFsbCBpbmRlbnRcbiAgICBpZiBqc3hJbmRlbnRcbiAgICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFswXVxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV1cbiAgICAgICAgICBibG9ja0luZGVudCArPSBqc3hJbmRlbnQgKiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV1cbiAgICBpZiBqc3hJbmRlbnRQcm9wc1xuICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMF1cbiAgICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV1cbiAgICAgICAgICBibG9ja0luZGVudCArPSBqc3hJbmRlbnRQcm9wcyAqIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzFdXG4gICAgIyBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzIGFsbG93cyBpbmRlbnRzIHRvIGJlIGdyZWF0ZXIgdGhhbiB0aGUgbWluaW11bVxuICAgICMgdXNlZCB3aGVyZSBpdGVtcyBhcmUgYWxpZ25lZCBidXQgbm8gZXNsaW50IHJ1bGVzIGFyZSBhcHBsaWNhYmxlXG4gICAgIyBzbyB1c2VyIGhhcyBzb21lIGRpc2NyZXRpb24gaW4gYWRkaW5nIG1vcmUgaW5kZW50c1xuICAgIGlmIGFsbG93QWRkaXRpb25hbEluZGVudHNcbiAgICAgIGlmIEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSA8IGJsb2NrSW5kZW50IG9yXG4gICAgICAgIEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSA+IGJsb2NrSW5kZW50ICsgYWxsb3dBZGRpdGlvbmFsSW5kZW50c1xuICAgICAgICAgIEBlZGl0b3Iuc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3cgcm93LCBibG9ja0luZGVudCwgeyBwcmVzZXJ2ZUxlYWRpbmdXaGl0ZXNwYWNlOiBmYWxzZSB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICBlbHNlXG4gICAgICBpZiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHJvdykgaXNudCBibG9ja0luZGVudFxuICAgICAgICBAZWRpdG9yLnNldEluZGVudGF0aW9uRm9yQnVmZmVyUm93IHJvdywgYmxvY2tJbmRlbnQsIHsgcHJlc2VydmVMZWFkaW5nV2hpdGVzcGFjZTogZmFsc2UgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxuIl19
