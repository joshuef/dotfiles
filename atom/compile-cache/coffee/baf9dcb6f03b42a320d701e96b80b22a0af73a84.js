(function() {
  var AFTERPROPS, AutoIndent, BRACE_CLOSE, BRACE_OPEN, CompositeDisposable, DidInsertText, File, JSXBRACE_CLOSE, JSXBRACE_OPEN, JSXTAG_CLOSE, JSXTAG_CLOSE_ATTRS, JSXTAG_OPEN, JSXTAG_SELFCLOSE_END, JSXTAG_SELFCLOSE_START, JS_ELSE, JS_IF, JS_RETURN, LINEALIGNED, NO_TOKEN, PAREN_CLOSE, PAREN_OPEN, PROPSALIGNED, Point, Range, SWITCH_BRACE_CLOSE, SWITCH_BRACE_OPEN, SWITCH_CASE, SWITCH_DEFAULT, TAGALIGNED, TEMPLATE_END, TEMPLATE_START, TERNARY_ELSE, TERNARY_IF, autoCompleteJSX, path, ref, stripJsonComments,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, File = ref.File, Range = ref.Range, Point = ref.Point;

  path = require('path');

  autoCompleteJSX = require('./auto-complete-jsx');

  DidInsertText = require('./did-insert-text');

  stripJsonComments = require('strip-json-comments');

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
      var YAML, err, eslintRules, fileContent, fs;
      fs = require('fs-plus');
      if (fs.isFileSync(eslintrcFile)) {
        fileContent = stripJsonComments(fs.readFileSync(eslintrcFile, 'utf8'));
        try {
          YAML = require('js-yaml');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9sYW5ndWFnZS1iYWJlbC9saWIvYXV0by1pbmRlbnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxtZkFBQTtJQUFBOzs7RUFBQSxNQUE0QyxPQUFBLENBQVEsTUFBUixDQUE1QyxFQUFDLDZDQUFELEVBQXNCLGVBQXRCLEVBQTRCLGlCQUE1QixFQUFtQzs7RUFDbkMsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHFCQUFSOztFQUNsQixhQUFBLEdBQWdCLE9BQUEsQ0FBUSxtQkFBUjs7RUFDaEIsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLHFCQUFSOztFQUdwQixRQUFBLEdBQTBCOztFQUMxQixzQkFBQSxHQUEwQjs7RUFDMUIsb0JBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGtCQUFBLEdBQTBCOztFQUMxQixZQUFBLEdBQTBCOztFQUMxQixhQUFBLEdBQTBCOztFQUMxQixjQUFBLEdBQTBCOztFQUMxQixVQUFBLEdBQTBCOztFQUMxQixXQUFBLEdBQTBCOztFQUMxQixVQUFBLEdBQTBCOztFQUMxQixZQUFBLEdBQTBCOztFQUMxQixLQUFBLEdBQTBCOztFQUMxQixPQUFBLEdBQTBCOztFQUMxQixpQkFBQSxHQUEwQjs7RUFDMUIsa0JBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGNBQUEsR0FBMEI7O0VBQzFCLFNBQUEsR0FBMEI7O0VBQzFCLFVBQUEsR0FBMEI7O0VBQzFCLFdBQUEsR0FBMEI7O0VBQzFCLGNBQUEsR0FBMEI7O0VBQzFCLFlBQUEsR0FBMEI7O0VBRzFCLFVBQUEsR0FBZ0I7O0VBQ2hCLFdBQUEsR0FBZ0I7O0VBQ2hCLFVBQUEsR0FBZ0I7O0VBQ2hCLFlBQUEsR0FBZ0I7O0VBRWhCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxvQkFBQyxNQUFEO01BQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7O01BQ1osSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSSxhQUFKLENBQWtCLElBQUMsQ0FBQSxNQUFuQjtNQUNqQixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixnQkFBaEIsQ0FBaUMsQ0FBQztNQUU3QyxJQUFDLENBQUEsU0FBRCxHQUFhO01BQ2IsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxxQkFBRCxHQUF5QjtNQUN6QixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUksbUJBQUosQ0FBQTtNQUNmLElBQUMsQ0FBQSxtQkFBRCxHQUF1QixJQUFDLENBQUEsZ0JBQUQsQ0FBQTtNQUN2QixJQUFDLENBQUEsYUFBRCxHQUFpQjtNQUdqQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFaLENBQW9CLDhCQUFwQixFQUNmLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO2lCQUFXLEtBQUMsQ0FBQSxPQUFELEdBQVc7UUFBdEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGUsQ0FBakI7TUFHQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUNmO1FBQUEsbUNBQUEsRUFBcUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO1lBQ25DLEtBQUMsQ0FBQSxPQUFELEdBQVc7bUJBQ1gsS0FBQyxDQUFBLG1CQUFELEdBQXVCLEtBQUMsQ0FBQSxnQkFBRCxDQUFBO1VBRlk7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJDO09BRGUsQ0FBakI7TUFLQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUNmO1FBQUEsb0NBQUEsRUFBc0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO21CQUFZLEtBQUMsQ0FBQSxPQUFELEdBQVc7VUFBdkI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRDO09BRGUsQ0FBakI7TUFHQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUNmO1FBQUEsdUNBQUEsRUFBeUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO1lBQ3ZDLEtBQUMsQ0FBQSxPQUFELEdBQVcsQ0FBSSxLQUFDLENBQUE7WUFDaEIsSUFBRyxLQUFDLENBQUEsT0FBSjtxQkFBaUIsS0FBQyxDQUFBLG1CQUFELEdBQXVCLEtBQUMsQ0FBQSxnQkFBRCxDQUFBLEVBQXhDOztVQUZ1QztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekM7T0FEZSxDQUFqQjtNQUtBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixXQUExQixFQUF1QyxJQUFDLENBQUEsV0FBeEM7TUFDQSxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsU0FBMUIsRUFBcUMsSUFBQyxDQUFBLFNBQXRDO01BRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxNQUFNLENBQUMseUJBQVIsQ0FBa0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7aUJBQVcsS0FBQyxDQUFBLHFCQUFELENBQXVCLEtBQXZCO1FBQVg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxDLENBQWpCO01BQ0EsSUFBQyxDQUFBLHVCQUFELENBQUE7SUFoQ1c7O3lCQWtDYixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO01BQ0EsSUFBQyxDQUFBLHdCQUF3QixDQUFDLE9BQTFCLENBQUE7TUFDQSxRQUFRLENBQUMsbUJBQVQsQ0FBNkIsV0FBN0IsRUFBMEMsSUFBQyxDQUFBLFdBQTNDO2FBQ0EsUUFBUSxDQUFDLG1CQUFULENBQTZCLFNBQTdCLEVBQXdDLElBQUMsQ0FBQSxTQUF6QztJQUpPOzt5QkFPVCxxQkFBQSxHQUF1QixTQUFDLEtBQUQ7QUFDckIsVUFBQTtNQUFBLElBQUEsQ0FBYyxJQUFDLENBQUEsT0FBZjtBQUFBLGVBQUE7O01BQ0EsSUFBQSxDQUFjLElBQUMsQ0FBQSxPQUFmO0FBQUEsZUFBQTs7TUFDQSxJQUFjLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUF4QixLQUFpQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBdkU7QUFBQSxlQUFBOztNQUNBLFNBQUEsR0FBWSxLQUFLLENBQUMsaUJBQWlCLENBQUM7TUFHcEMsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGtCQUFSLENBQUEsQ0FBSDtRQUNFLGVBQUEsR0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyx3QkFBUixDQUFBO1FBQ2xCLElBQUcsZUFBZSxDQUFDLE1BQWhCLEtBQTBCLElBQUMsQ0FBQSxxQkFBOUI7VUFDRSxJQUFDLENBQUEscUJBQUQsR0FBeUI7VUFDekIsU0FBQSxHQUFZO0FBQ1osZUFBQSxpREFBQTs7WUFDRSxJQUFHLGNBQWMsQ0FBQyxHQUFmLEdBQXFCLFNBQXhCO2NBQXVDLFNBQUEsR0FBWSxjQUFjLENBQUMsSUFBbEU7O0FBREYsV0FIRjtTQUFBLE1BQUE7VUFNRSxJQUFDLENBQUEscUJBQUQ7QUFDQSxpQkFQRjtTQUZGO09BQUEsTUFBQTtRQVVLLGNBQUEsR0FBaUIsS0FBSyxDQUFDLGtCQVY1Qjs7TUFhQSxXQUFBLEdBQWMsS0FBSyxDQUFDLGlCQUFpQixDQUFDO01BQ3RDLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxXQUFaLENBQUg7UUFDRSxlQUFBLHNGQUEyRSxDQUFBLENBQUEsQ0FBRSxDQUFDO1FBQzlFLElBQUcsdUJBQUg7VUFDRSxJQUFDLENBQUEsU0FBRCxDQUFXO1lBQUMsR0FBQSxFQUFLLFdBQU47WUFBb0IsV0FBQSxFQUFhLENBQWpDO1dBQVgsRUFERjtTQUZGOztNQUtBLElBQVUsQ0FBSSxJQUFDLENBQUEsVUFBRCxDQUFZLFNBQVosQ0FBZDtBQUFBLGVBQUE7O01BRUEsYUFBQSxHQUFnQixJQUFJLEtBQUosQ0FBVSxTQUFWLEVBQW9CLENBQXBCO01BQ2hCLGVBQUEsR0FBbUIsZUFBZSxDQUFDLGFBQWhCLENBQThCLElBQUMsQ0FBQSxNQUEvQixFQUF1QyxjQUF2QztNQUNuQixJQUFDLENBQUEsU0FBRCxDQUFXLElBQUksS0FBSixDQUFVLGVBQVYsRUFBMkIsYUFBM0IsQ0FBWDtNQUNBLGNBQUEsb0ZBQXdFLENBQUEsQ0FBQSxDQUFFLENBQUM7TUFDM0UsSUFBRyxzQkFBSDtlQUF3QixJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLENBQUMsU0FBRCxFQUFZLGNBQVosQ0FBaEMsRUFBeEI7O0lBaENxQjs7eUJBb0N2QixlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsSUFBQSxDQUFjLElBQUMsQ0FBQSxPQUFmO0FBQUEsZUFBQTs7TUFDQSxJQUFBLENBQWMsSUFBQyxDQUFBLE9BQWY7QUFBQSxlQUFBOztNQUNBLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxzQkFBUixDQUFBO01BR2hCLElBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFwQixLQUEyQixhQUFhLENBQUMsR0FBRyxDQUFDLEdBQTdDLElBQ0QsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFwQixLQUE4QixhQUFhLENBQUMsR0FBRyxDQUFDLE1BRGxEO1FBRUksSUFBVSxhQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDLGdDQUFSLENBQXlDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFyQixFQUEwQixhQUFhLENBQUMsS0FBSyxDQUFDLE1BQTlDLENBQXpDLENBQStGLENBQUMsY0FBaEcsQ0FBQSxDQUFwQixFQUFBLGdCQUFBLE1BQVY7QUFBQSxpQkFBQTs7UUFDQSxJQUFVLGFBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0NBQVIsQ0FBeUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQXJCLEVBQTBCLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBOUMsQ0FBekMsQ0FBK0YsQ0FBQyxjQUFoRyxDQUFBLENBQXBCLEVBQUEsZ0JBQUEsTUFBVjtBQUFBLGlCQUFBO1NBSEo7O01BS0EsVUFBQSxHQUFhLElBQUksQ0FBQyxHQUFMLENBQVMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUE3QixFQUFrQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQXBEO01BQ2IsU0FBQSxHQUFZLElBQUksQ0FBQyxHQUFMLENBQVMsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUE3QixFQUFrQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQXBEO01BR1osSUFBQyxDQUFBLHdCQUF3QixDQUFDLE9BQTFCLENBQUE7QUFHQSxhQUFRLFVBQUEsSUFBYyxTQUF0QjtRQUNFLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaLENBQUg7VUFDRSxhQUFBLEdBQWdCLElBQUksS0FBSixDQUFVLFVBQVYsRUFBcUIsQ0FBckI7VUFDaEIsZUFBQSxHQUFtQixlQUFlLENBQUMsYUFBaEIsQ0FBOEIsSUFBQyxDQUFBLE1BQS9CLEVBQXVDLGFBQXZDO1VBQ25CLElBQUMsQ0FBQSxTQUFELENBQVcsSUFBSSxLQUFKLENBQVUsZUFBVixFQUEyQixhQUEzQixDQUFYO1VBQ0EsVUFBQSxHQUFhLGVBQWUsQ0FBQyxHQUFoQixHQUFzQixFQUpyQztTQUFBLE1BQUE7VUFLSyxVQUFBLEdBQWEsVUFBQSxHQUFhLEVBTC9COztNQURGO01BVUEsVUFBQSxDQUFXLElBQUMsQ0FBQSx1QkFBWixFQUFxQyxHQUFyQztJQTVCZTs7eUJBK0JqQix1QkFBQSxHQUF5QixTQUFBO2FBQ3ZCLElBQUMsQ0FBQSx3QkFBRCxHQUE0QixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBTSxLQUFDLENBQUEsZUFBRCxDQUFBO1FBQU47TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFCO0lBREw7O3lCQUl6QixVQUFBLEdBQVksU0FBQyxTQUFEO0FBQ1YsVUFBQTtNQUFBLE1BQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLGdDQUFSLENBQXlDLENBQUMsU0FBRCxFQUFZLENBQVosQ0FBekMsQ0FBd0QsQ0FBQyxjQUF6RCxDQUFBO0FBQ1QsYUFBTyxhQUFrQixNQUFsQixFQUFBLGNBQUE7SUFGRzs7eUJBWVosU0FBQSxHQUFXLFNBQUMsS0FBRDtBQUNULFVBQUE7TUFBQSxVQUFBLEdBQWE7TUFDYixVQUFBLEdBQWE7TUFDYixzQkFBQSxHQUF5QjtNQUN6QixNQUFBLEdBQVU7TUFDVixpQkFBQSxHQUFvQjtNQUNwQixJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7TUFDdkIsSUFBQyxDQUFBLGFBQUQsR0FBaUI7QUFFakI7V0FBVyw0SEFBWDtRQUNFLGtCQUFBLEdBQXFCO1FBQ3JCLGVBQUEsR0FBa0I7UUFDbEIsWUFBQSxHQUFlO1FBQ2YseUJBQUEsR0FBNkI7UUFDN0IsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsR0FBN0I7QUFHUCxlQUFPLENBQUUsS0FBQSxHQUFRLElBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixJQUFoQixDQUFWLENBQUEsS0FBc0MsSUFBN0M7VUFDRSxXQUFBLEdBQWMsS0FBSyxDQUFDO1VBQ3BCLGVBQUEsR0FBa0IsSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLFdBQWY7VUFDbEIsYUFBQSxHQUFnQixJQUFJLEtBQUosQ0FBVSxHQUFWLEVBQWUsV0FBQSxHQUFjLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUF2QixHQUFnQyxDQUEvQztVQUNoQixVQUFBLEdBQWEsSUFBSSxLQUFKLENBQVUsZUFBVixFQUEyQixhQUEzQjtVQUViLElBQUcsR0FBQSxLQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBbkIsSUFBMkIsV0FBQSxHQUFjLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBeEQ7QUFBb0UscUJBQXBFOztVQUNBLElBQUcsQ0FBSSxDQUFBLEtBQUEsR0FBUyxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFBZSxLQUFmLENBQVQsQ0FBUDtBQUEyQyxxQkFBM0M7O1VBRUEsb0JBQUEsR0FBd0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxHQUFoQztVQUV4QixJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFBLENBQUg7WUFDRSxnQkFBQSxHQUFvQixXQUFBLEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUEsRUFEcEM7V0FBQSxNQUFBO1lBRUssZ0JBQUEsR0FDQSxDQUFBLFNBQUMsTUFBRDtBQUNELGtCQUFBO2NBREUsSUFBQyxDQUFBLFNBQUQ7Y0FDRixhQUFBLEdBQWdCLFVBQUEsR0FBYTtBQUM3QixtQkFBUyx5RkFBVDtnQkFDRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFaLEVBQWUsQ0FBZixDQUFELENBQUEsS0FBc0IsSUFBMUI7a0JBQ0UsYUFBQSxHQURGO2lCQUFBLE1BQUE7a0JBR0UsVUFBQSxHQUhGOztBQURGO0FBS0EscUJBQU8sYUFBQSxHQUFnQixDQUFFLFVBQUEsR0FBYSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQSxDQUFmO1lBUHRCLENBQUEsQ0FBSCxDQUFJLElBQUMsQ0FBQSxNQUFMLEVBSEY7O0FBZUEsa0JBQVEsS0FBUjtBQUFBLGlCQUVPLFdBRlA7Y0FHSSxlQUFBLEdBQWtCO2NBRWxCLElBQUcsa0JBQUg7Z0JBQ0Usc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2dCQWFBLElBQUcsaUJBQUEsSUFDQyx3QkFERCxJQUVDLENBQUUsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLFVBQW5DLElBQ0YsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLGFBRG5DLENBRko7a0JBSU0seUJBQUEsR0FBNkI7a0JBQzdCLG9CQUFBLEdBQ0UsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFNBQVUsQ0FBQSxDQUFBLENBQS9CLEdBQW9DLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQztrQkFDakUsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7b0JBQUMsR0FBQSxFQUFLLEdBQU47b0JBQVksV0FBQSxFQUFhLG9CQUF6QjttQkFBWCxFQVByQjtpQkFBQSxNQVFLLElBQUcsaUJBQUEsSUFBc0Isd0JBQXpCO2tCQUNILFlBQUEsR0FBZSxJQUFDLENBQUEsU0FBRCxDQUFXO29CQUFDLEdBQUEsRUFBSyxHQUFOO29CQUFZLFdBQUEsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsR0FBeEIsQ0FBekI7b0JBQXVELFNBQUEsRUFBVyxDQUFsRTttQkFBWCxFQURaO2lCQUFBLE1BRUEsSUFBRyx3QkFBQSxJQUFvQixJQUFDLENBQUEsNkJBQUQsQ0FBK0IsR0FBL0IsQ0FBdkI7a0JBQ0gseUJBQUEsR0FBNkI7a0JBQzdCLG9CQUFBLEdBQXVCLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixHQUF4QjtrQkFDdkIsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7b0JBQUMsR0FBQSxFQUFLLEdBQU47b0JBQVksV0FBQSxFQUFhLG9CQUF6QjttQkFBWCxFQUhaO2lCQUFBLE1BSUEsSUFBRyxzQkFBSDtrQkFDSCxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztvQkFBQyxHQUFBLEVBQUssR0FBTjtvQkFBWSxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFwRDtvQkFBMEUsU0FBQSxFQUFXLENBQXJGO21CQUFYLEVBRFo7aUJBNUJQOztjQWdDQSxJQUFHLFlBQUg7Z0JBQ0UsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsR0FBN0I7Z0JBQ1AsSUFBQyxDQUFBLFNBQVMsQ0FBQyxTQUFYLEdBQXVCO0FBQ3ZCLHlCQUhGOztjQUtBLGtCQUFBLEdBQXFCO2NBQ3JCLGlCQUFBLEdBQW9CO2NBRXBCLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztjQUNBLFVBQVUsQ0FBQyxJQUFYLENBQ0U7Z0JBQUEsSUFBQSxFQUFNLFdBQU47Z0JBQ0EsSUFBQSxFQUFNLEtBQU0sQ0FBQSxDQUFBLENBRFo7Z0JBRUEsR0FBQSxFQUFLLEdBRkw7Z0JBR0EseUJBQUEsRUFBMkIseUJBSDNCO2dCQUlBLGdCQUFBLEVBQWtCLGdCQUpsQjtnQkFLQSxvQkFBQSxFQUFzQixvQkFMdEI7Z0JBTUEsY0FBQSxFQUFnQixjQU5oQjtnQkFPQSwwQkFBQSxFQUE0QixJQVA1QjtnQkFRQSxlQUFBLEVBQWlCLElBUmpCO2VBREY7Y0FXQSxzQkFBc0IsQ0FBQyxJQUF2QixDQUE0QixVQUE1QjtjQUNBLFVBQUE7QUF4REc7QUFGUCxpQkE2RE8sWUE3RFA7Y0E4REksZUFBQSxHQUFrQjtjQUNsQixJQUFHLGtCQUFIO2dCQUNFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztnQkFDQSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztrQkFBQyxHQUFBLEVBQUssR0FBTjtrQkFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFuRDtpQkFBWCxFQUZqQjs7Y0FLQSxJQUFHLFlBQUg7Z0JBQ0UsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsR0FBN0I7Z0JBQ1AsSUFBQyxDQUFBLFNBQVMsQ0FBQyxTQUFYLEdBQXVCO0FBQ3ZCLHlCQUhGOztjQUtBLGtCQUFBLEdBQXFCO2NBQ3JCLGlCQUFBLEdBQW9CO2NBRXBCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQTtjQUNqQixVQUFVLENBQUMsSUFBWCxDQUNFO2dCQUFBLElBQUEsRUFBTSxZQUFOO2dCQUNBLElBQUEsRUFBTSxLQUFNLENBQUEsQ0FBQSxDQURaO2dCQUVBLEdBQUEsRUFBSyxHQUZMO2dCQUdBLGNBQUEsRUFBZ0IsY0FIaEI7ZUFERjtjQUtBLElBQUcsY0FBQSxJQUFpQixDQUFwQjtnQkFBMkIsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLGVBQTNCLEdBQTZDLFdBQXhFOztjQUNBLFVBQUE7QUF0Qkc7QUE3RFAsaUJBc0ZPLG9CQXRGUDtjQXVGSSxlQUFBLEdBQWtCO2NBQ2xCLElBQUcsa0JBQUg7Z0JBQ0Usc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2dCQUVBLFlBQUEsR0FBZSxJQUFDLENBQUEsdUJBQUQsQ0FBMEIsR0FBMUIsRUFDYixVQUFXLENBQUEsY0FBQSxDQURFLEVBRWIsSUFBQyxDQUFBLG1CQUFtQixDQUFDLHlCQUEwQixDQUFBLENBQUEsQ0FBRSxDQUFDLFdBRnJDLEVBSGpCOztjQVFBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0EsaUJBQUEsR0FBb0I7Y0FDcEIsa0JBQUEsR0FBcUI7Y0FFckIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBO2NBQ2pCLFVBQVUsQ0FBQyxJQUFYLENBQ0U7Z0JBQUEsSUFBQSxFQUFNLG9CQUFOO2dCQUNBLElBQUEsRUFBTSxVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsSUFEakM7Z0JBRUEsR0FBQSxFQUFLLEdBRkw7Z0JBR0EsY0FBQSxFQUFnQixjQUhoQjtlQURGO2NBS0EsSUFBRyxjQUFBLElBQWtCLENBQXJCO2dCQUNFLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQywwQkFBM0IsR0FBd0Q7Z0JBQ3hELFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxJQUEzQixHQUFrQztnQkFDbEMsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLGVBQTNCLEdBQTZDLFdBSC9DOztjQUlBLFVBQUE7QUE1Qkc7QUF0RlAsaUJBcUhPLGtCQXJIUDtjQXNISSxlQUFBLEdBQWtCO2NBQ2xCLElBQUcsa0JBQUg7Z0JBQ0Usc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2dCQUVBLFlBQUEsR0FBZSxJQUFDLENBQUEsdUJBQUQsQ0FBMEIsR0FBMUIsRUFDYixVQUFXLENBQUEsY0FBQSxDQURFLEVBRWIsSUFBQyxDQUFBLG1CQUFtQixDQUFDLHlCQUEwQixDQUFBLENBQUEsQ0FBRSxDQUFDLFFBRnJDLEVBSGpCOztjQVFBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0EsaUJBQUEsR0FBb0I7Y0FDcEIsa0JBQUEsR0FBcUI7Y0FFckIsc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2NBQ0EsVUFBVSxDQUFDLElBQVgsQ0FDRTtnQkFBQSxJQUFBLEVBQU0sa0JBQU47Z0JBQ0EsSUFBQSxFQUFNLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxJQURqQztnQkFFQSxHQUFBLEVBQUssR0FGTDtnQkFHQSxjQUFBLEVBQWdCLGNBSGhCO2VBREY7Y0FLQSxJQUFHLGNBQUEsSUFBa0IsQ0FBckI7Z0JBQTRCLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQywwQkFBM0IsR0FBd0QsV0FBcEY7O2NBQ0EsVUFBQTtBQXpCRztBQXJIUCxpQkFpSk8sYUFqSlA7Y0FrSkksZUFBQSxHQUFrQjtjQUNsQixJQUFHLGtCQUFIO2dCQUNFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztnQkFDQSxJQUFHLHNCQUFIO2tCQUNFLElBQUcsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLFdBQW5DLElBQW1ELFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQywwQkFBM0IsS0FBeUQsSUFBL0c7b0JBQ0UsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7c0JBQUMsR0FBQSxFQUFLLEdBQU47c0JBQVcsV0FBQSxFQUFhLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxvQkFBbkQ7c0JBQXlFLGNBQUEsRUFBZ0IsQ0FBekY7cUJBQVgsRUFEakI7bUJBQUEsTUFBQTtvQkFHRSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztzQkFBQyxHQUFBLEVBQUssR0FBTjtzQkFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFuRDtzQkFBeUUsU0FBQSxFQUFXLENBQXBGO3FCQUFYLEVBSGpCO21CQURGO2lCQUZGOztjQVNBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0EsaUJBQUEsR0FBb0I7Y0FDcEIsa0JBQUEsR0FBcUI7Y0FFckIsc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2NBQ0EsVUFBVSxDQUFDLElBQVgsQ0FDRTtnQkFBQSxJQUFBLEVBQU0sS0FBTjtnQkFDQSxJQUFBLEVBQU0sRUFETjtnQkFFQSxHQUFBLEVBQUssR0FGTDtnQkFHQSx5QkFBQSxFQUEyQix5QkFIM0I7Z0JBSUEsZ0JBQUEsRUFBa0IsZ0JBSmxCO2dCQUtBLG9CQUFBLEVBQXNCLG9CQUx0QjtnQkFNQSxjQUFBLEVBQWdCLGNBTmhCO2dCQU9BLDBCQUFBLEVBQTRCLElBUDVCO2dCQVFBLGVBQUEsRUFBaUIsSUFSakI7ZUFERjtjQVdBLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLFVBQTVCO2NBQ0EsVUFBQTtBQWhDRztBQWpKUCxpQkFvTE8sVUFwTFA7Y0FxTEksZUFBQSxHQUFrQjtjQUNsQixJQUFHLGtCQUFIO2dCQUVFLElBQUcsb0JBQUEsS0FBd0IsZ0JBQTNCO2tCQUNFLFlBQUEsR0FBZSxJQUFDLENBQUEsU0FBRCxDQUFXO29CQUFDLEdBQUEsRUFBSyxHQUFOO29CQUFXLFdBQUEsRUFBYSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsR0FBeEIsQ0FBeEI7b0JBQXNELFNBQUEsRUFBVyxDQUFqRTttQkFBWCxFQURqQjtpQkFBQSxNQUFBO2tCQUdFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztrQkFDQSxJQUFHLHNCQUFIO29CQUNFLElBQUcsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLFdBQW5DLElBQW1ELFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQywwQkFBM0IsS0FBeUQsSUFBL0c7c0JBQ0UsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7d0JBQUMsR0FBQSxFQUFLLEdBQU47d0JBQVcsV0FBQSxFQUFhLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxvQkFBbkQ7d0JBQXlFLGNBQUEsRUFBZ0IsQ0FBekY7dUJBQVgsRUFEakI7cUJBQUEsTUFBQTtzQkFHRSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVzt3QkFBQyxHQUFBLEVBQUssR0FBTjt3QkFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFuRDt3QkFBeUUsU0FBQSxFQUFXLENBQXBGO3VCQUFYLEVBSGpCO3FCQURGO21CQUpGO2lCQUZGOztjQWNBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0EsaUJBQUEsR0FBb0I7Y0FDcEIsa0JBQUEsR0FBcUI7Y0FFckIsc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2NBQ0EsVUFBVSxDQUFDLElBQVgsQ0FDRTtnQkFBQSxJQUFBLEVBQU0sS0FBTjtnQkFDQSxJQUFBLEVBQU0sRUFETjtnQkFFQSxHQUFBLEVBQUssR0FGTDtnQkFHQSx5QkFBQSxFQUEyQix5QkFIM0I7Z0JBSUEsZ0JBQUEsRUFBa0IsZ0JBSmxCO2dCQUtBLG9CQUFBLEVBQXNCLG9CQUx0QjtnQkFNQSxjQUFBLEVBQWdCLGNBTmhCO2dCQU9BLDBCQUFBLEVBQTRCLElBUDVCO2dCQVFBLGVBQUEsRUFBaUIsSUFSakI7ZUFERjtjQVdBLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLFVBQTVCO2NBQ0EsVUFBQTtBQXJDRztBQXBMUCxpQkE0Tk8sY0E1TlA7QUFBQSxpQkE0TnVCLFlBNU52QjtjQTZOSSxlQUFBLEdBQWtCO2NBRWxCLElBQUcsa0JBQUg7Z0JBQ0Usc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2dCQUNBLFlBQUEsR0FBZSxJQUFDLENBQUEsU0FBRCxDQUFXO2tCQUFDLEdBQUEsRUFBSyxHQUFOO2tCQUFXLFdBQUEsRUFBYSxVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsb0JBQW5EO2lCQUFYLEVBRmpCOztjQUlBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0EsaUJBQUEsR0FBb0I7Y0FDcEIsa0JBQUEsR0FBcUI7Y0FFckIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBO2NBQ2pCLFVBQVUsQ0FBQyxJQUFYLENBQ0U7Z0JBQUEsSUFBQSxFQUFNLEtBQU47Z0JBQ0EsSUFBQSxFQUFNLEVBRE47Z0JBRUEsR0FBQSxFQUFLLEdBRkw7Z0JBR0EsY0FBQSxFQUFnQixjQUhoQjtlQURGO2NBTUEsSUFBRyxjQUFBLElBQWlCLENBQXBCO2dCQUEyQixVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsZUFBM0IsR0FBNkMsV0FBeEU7O2NBQ0EsVUFBQTtBQXZCbUI7QUE1TnZCLGlCQXNQTyxVQXRQUDtBQUFBLGlCQXNQbUIsaUJBdFBuQjtBQUFBLGlCQXNQc0MsVUF0UHRDO0FBQUEsaUJBc1BrRCxjQXRQbEQ7Y0F1UEksZUFBQSxHQUFrQjtjQUNsQixJQUFHLEtBQUEsS0FBUyxjQUFaO2dCQUFnQyxJQUFDLENBQUEsYUFBRCxHQUFoQzs7Y0FDQSxJQUFHLGtCQUFIO2dCQUNFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztnQkFDQSxJQUFHLGlCQUFBLElBQ0Msd0JBREQsSUFFQyxVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsSUFBM0IsS0FBbUMsS0FGcEMsSUFHQyxVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsR0FBM0IsS0FBa0MsQ0FBRSxHQUFBLEdBQU0sQ0FBUixDQUh0QztrQkFJTSxnQkFBQSxHQUFtQixvQkFBQSxHQUNqQixJQUFDLENBQUEsbUJBQW1CLENBQUMsU0FBVSxDQUFBLENBQUEsQ0FBL0IsR0FBb0MsSUFBQyxDQUFBLHNCQUFELENBQXdCLEdBQXhCO2tCQUN0QyxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztvQkFBQyxHQUFBLEVBQUssR0FBTjtvQkFBVyxXQUFBLEVBQWEsb0JBQXhCO21CQUFYLEVBTnJCO2lCQUFBLE1BT0ssSUFBRyx3QkFBQSxJQUFvQixJQUFDLENBQUEsNkJBQUQsQ0FBK0IsR0FBL0IsQ0FBdkI7a0JBQ0gseUJBQUEsR0FBNkI7a0JBQzdCLG9CQUFBLEdBQXVCLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixHQUF4QjtrQkFDdkIsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7b0JBQUMsR0FBQSxFQUFLLEdBQU47b0JBQVksV0FBQSxFQUFhLG9CQUF6QjttQkFBWCxFQUhaO2lCQUFBLE1BSUEsSUFBRyxzQkFBSDtrQkFDSCxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztvQkFBQyxHQUFBLEVBQUssR0FBTjtvQkFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFuRDtvQkFBeUUsU0FBQSxFQUFXLENBQXBGO21CQUFYLEVBRFo7aUJBYlA7O2NBaUJBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0Esa0JBQUEsR0FBcUI7Y0FFckIsc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2NBQ0EsVUFBVSxDQUFDLElBQVgsQ0FDRTtnQkFBQSxJQUFBLEVBQU0sS0FBTjtnQkFDQSxJQUFBLEVBQU0sRUFETjtnQkFFQSxHQUFBLEVBQUssR0FGTDtnQkFHQSx5QkFBQSxFQUEyQix5QkFIM0I7Z0JBSUEsZ0JBQUEsRUFBa0IsZ0JBSmxCO2dCQUtBLG9CQUFBLEVBQXNCLG9CQUx0QjtnQkFNQSxjQUFBLEVBQWdCLGNBTmhCO2dCQU9BLDBCQUFBLEVBQTRCLElBUDVCO2dCQVFBLGVBQUEsRUFBaUIsSUFSakI7ZUFERjtjQVdBLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLFVBQTVCO2NBQ0EsVUFBQTtBQXhDOEM7QUF0UGxELGlCQWlTTyxXQWpTUDtBQUFBLGlCQWlTb0Isa0JBalNwQjtBQUFBLGlCQWlTd0MsV0FqU3hDO0FBQUEsaUJBaVNxRCxZQWpTckQ7Y0FtU0ksSUFBRyxLQUFBLEtBQVMsa0JBQVo7Z0JBQ0Usc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2dCQUNBLElBQUcsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLFdBQW5DLElBQWtELFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxJQUEzQixLQUFtQyxjQUF4RjtrQkFHRSxzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLEVBSEY7aUJBRkY7O2NBT0EsZUFBQSxHQUFrQjtjQUNsQixJQUFHLGtCQUFIO2dCQUNFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztnQkFDQSxJQUFHLHNCQUFIO2tCQUNFLFlBQUEsR0FBZSxJQUFDLENBQUEsU0FBRCxDQUFXO29CQUFDLEdBQUEsRUFBSyxHQUFOO29CQUFXLFdBQUEsRUFBYSxVQUFXLENBQUEsY0FBQSxDQUFlLENBQUMsb0JBQW5EO21CQUFYLEVBRGpCO2lCQUZGOztjQU1BLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0Esa0JBQUEsR0FBcUI7Y0FFckIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBO2NBQ2pCLElBQUcsc0JBQUg7Z0JBQ0UsVUFBVSxDQUFDLElBQVgsQ0FDRTtrQkFBQSxJQUFBLEVBQU0sS0FBTjtrQkFDQSxJQUFBLEVBQU0sRUFETjtrQkFFQSxHQUFBLEVBQUssR0FGTDtrQkFHQSxjQUFBLEVBQWdCLGNBSGhCO2lCQURGO2dCQUtBLElBQUcsY0FBQSxJQUFpQixDQUFwQjtrQkFBMkIsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLGVBQTNCLEdBQTZDLFdBQXhFOztnQkFDQSxVQUFBLEdBUEY7O2NBU0EsSUFBRyxLQUFBLEtBQVMsWUFBWjtnQkFBOEIsSUFBQyxDQUFBLGFBQUQsR0FBOUI7O0FBakNpRDtBQWpTckQsaUJBcVVPLFdBclVQO0FBQUEsaUJBcVVvQixjQXJVcEI7Y0FzVUksZUFBQSxHQUFrQjtjQUNsQixpQkFBQSxHQUFvQjtjQUNwQixJQUFHLGtCQUFIO2dCQUNFLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztnQkFDQSxJQUFHLHNCQUFIO2tCQUNFLElBQUcsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLElBQTNCLEtBQW1DLFdBQW5DLElBQWtELFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxJQUEzQixLQUFtQyxjQUF4RjtvQkFJRSxZQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsQ0FBVztzQkFBQyxHQUFBLEVBQUssR0FBTjtzQkFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLGNBQUEsQ0FBZSxDQUFDLG9CQUFuRDtxQkFBWDtvQkFDZixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLEVBTEY7bUJBQUEsTUFNSyxJQUFHLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxJQUEzQixLQUFtQyxpQkFBdEM7b0JBQ0gsWUFBQSxHQUFlLElBQUMsQ0FBQSxTQUFELENBQVc7c0JBQUMsR0FBQSxFQUFLLEdBQU47c0JBQVcsV0FBQSxFQUFhLFVBQVcsQ0FBQSxjQUFBLENBQWUsQ0FBQyxvQkFBbkQ7c0JBQXlFLFNBQUEsRUFBVyxDQUFwRjtxQkFBWCxFQURaO21CQVBQO2lCQUZGOztjQWFBLElBQUcsWUFBSDtnQkFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtnQkFDUCxJQUFDLENBQUEsU0FBUyxDQUFDLFNBQVgsR0FBdUI7QUFDdkIseUJBSEY7O2NBS0Esa0JBQUEsR0FBcUI7Y0FFckIsc0JBQXNCLENBQUMsSUFBdkIsQ0FBNEIsY0FBQSxHQUFpQixzQkFBc0IsQ0FBQyxHQUF2QixDQUFBLENBQTdDO2NBRUEsVUFBVSxDQUFDLElBQVgsQ0FDRTtnQkFBQSxJQUFBLEVBQU0sS0FBTjtnQkFDQSxJQUFBLEVBQU0sRUFETjtnQkFFQSxHQUFBLEVBQUssR0FGTDtnQkFHQSx5QkFBQSxFQUEyQix5QkFIM0I7Z0JBSUEsZ0JBQUEsRUFBa0IsZ0JBSmxCO2dCQUtBLG9CQUFBLEVBQXNCLG9CQUx0QjtnQkFNQSxjQUFBLEVBQWdCLGNBTmhCO2dCQU9BLDBCQUFBLEVBQTRCLElBUDVCO2dCQVFBLGVBQUEsRUFBaUIsSUFSakI7ZUFERjtjQVdBLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLFVBQTVCO2NBQ0EsVUFBQTtBQXJDZ0I7QUFyVXBCLGlCQTZXTyxLQTdXUDtBQUFBLGlCQTZXYyxPQTdXZDtBQUFBLGlCQTZXdUIsU0E3V3ZCO2NBOFdJLGlCQUFBLEdBQW9CO0FBOVd4QjtRQTFCRjtRQTJZQSxJQUFHLFVBQUEsSUFBZSxDQUFJLGVBQXRCO1VBRUUsSUFBRyxHQUFBLEtBQVMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUF0QjtZQUNFLGVBQUEsOEVBQW1FLENBQUEsQ0FBQSxDQUFFLENBQUM7WUFDdEUsSUFBRyx1QkFBSDsyQkFDRSxJQUFDLENBQUEsU0FBRCxDQUFXO2dCQUFDLEdBQUEsRUFBSyxHQUFOO2dCQUFZLFdBQUEsRUFBYSxDQUF6QjtlQUFYLEdBREY7YUFBQSxNQUFBOzJCQUdFLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixHQUF2QixFQUE0QixVQUE1QixFQUF3QyxzQkFBeEMsR0FIRjthQUZGO1dBQUEsTUFBQTt5QkFPRSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsR0FBdkIsRUFBNEIsVUFBNUIsRUFBd0Msc0JBQXhDLEdBUEY7V0FGRjtTQUFBLE1BQUE7K0JBQUE7O0FBblpGOztJQVRTOzt5QkF5YVgscUJBQUEsR0FBdUIsU0FBQyxHQUFELEVBQU0sVUFBTixFQUFrQixzQkFBbEI7QUFDckIsVUFBQTtNQUFBLHNCQUFzQixDQUFDLElBQXZCLENBQTRCLGNBQUEsR0FBaUIsc0JBQXNCLENBQUMsR0FBdkIsQ0FBQSxDQUE3QztNQUNBLElBQWMsc0JBQWQ7QUFBQSxlQUFBOztNQUNBLEtBQUEsR0FBUSxVQUFXLENBQUEsY0FBQTtBQUNuQixjQUFPLEtBQUssQ0FBQyxJQUFiO0FBQUEsYUFDTyxXQURQO0FBQUEsYUFDb0Isc0JBRHBCO1VBRUksSUFBSSxLQUFLLENBQUMsMEJBQU4sS0FBb0MsSUFBeEM7bUJBQ0UsSUFBQyxDQUFBLFNBQUQsQ0FBVztjQUFDLEdBQUEsRUFBSyxHQUFOO2NBQVcsV0FBQSxFQUFhLEtBQUssQ0FBQyxvQkFBOUI7Y0FBb0QsY0FBQSxFQUFnQixDQUFwRTthQUFYLEVBREY7V0FBQSxNQUFBO21CQUVLLElBQUMsQ0FBQSxTQUFELENBQVc7Y0FBQyxHQUFBLEVBQUssR0FBTjtjQUFXLFdBQUEsRUFBYSxLQUFLLENBQUMsb0JBQTlCO2NBQW9ELFNBQUEsRUFBVyxDQUEvRDthQUFYLEVBRkw7O0FBRGdCO0FBRHBCLGFBS08sYUFMUDtBQUFBLGFBS3NCLFVBTHRCO2lCQU1JLElBQUMsQ0FBQSxTQUFELENBQVc7WUFBQyxHQUFBLEVBQUssR0FBTjtZQUFXLFdBQUEsRUFBYSxLQUFLLENBQUMsb0JBQTlCO1lBQW9ELFNBQUEsRUFBVyxDQUEvRDtZQUFrRSxzQkFBQSxFQUF3QixJQUExRjtXQUFYO0FBTkosYUFPTyxVQVBQO0FBQUEsYUFPbUIsaUJBUG5CO0FBQUEsYUFPc0MsVUFQdEM7aUJBUUksSUFBQyxDQUFBLFNBQUQsQ0FBVztZQUFDLEdBQUEsRUFBSyxHQUFOO1lBQVcsV0FBQSxFQUFhLEtBQUssQ0FBQyxvQkFBOUI7WUFBb0QsU0FBQSxFQUFXLENBQS9EO1lBQWtFLHNCQUFBLEVBQXdCLElBQTFGO1dBQVg7QUFSSixhQVNPLG9CQVRQO0FBQUEsYUFTNkIsY0FUN0I7QUFBQSxhQVM2QyxrQkFUN0M7QUFBQSxhQVNpRSxZQVRqRTtpQkFVSSxJQUFDLENBQUEsU0FBRCxDQUFXO1lBQUMsR0FBQSxFQUFLLEdBQU47WUFBVyxXQUFBLEVBQWEsVUFBVyxDQUFBLEtBQUssQ0FBQyxjQUFOLENBQXFCLENBQUMsb0JBQXpEO1lBQStFLGNBQUEsRUFBZ0IsQ0FBL0Y7V0FBWDtBQVZKLGFBV08sV0FYUDtBQUFBLGFBV29CLGtCQVhwQjtBQUFBLGFBV3dDLFdBWHhDO2lCQVlJLElBQUMsQ0FBQSxTQUFELENBQVc7WUFBQyxHQUFBLEVBQUssR0FBTjtZQUFXLFdBQUEsRUFBYSxVQUFXLENBQUEsS0FBSyxDQUFDLGNBQU4sQ0FBcUIsQ0FBQyxvQkFBekQ7WUFBK0UsU0FBQSxFQUFXLENBQTFGO1lBQTZGLHNCQUFBLEVBQXdCLElBQXJIO1dBQVg7QUFaSixhQWFPLFdBYlA7QUFBQSxhQWFvQixjQWJwQjtpQkFjSSxJQUFDLENBQUEsU0FBRCxDQUFXO1lBQUMsR0FBQSxFQUFLLEdBQU47WUFBVyxXQUFBLEVBQWEsS0FBSyxDQUFDLG9CQUE5QjtZQUFvRCxTQUFBLEVBQVcsQ0FBL0Q7V0FBWDtBQWRKLGFBZU8sY0FmUDtBQUFBLGFBZXVCLFlBZnZCO0FBQUE7SUFKcUI7O3lCQXVCdkIsUUFBQSxHQUFVLFNBQUMsU0FBRCxFQUFZLEtBQVo7QUFDUixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0NBQVIsQ0FBeUMsQ0FBQyxTQUFELEVBQVksS0FBSyxDQUFDLEtBQWxCLENBQXpDLENBQWtFLENBQUMsY0FBbkUsQ0FBQSxDQUFtRixDQUFDLEdBQXBGLENBQUE7TUFDUixJQUFHLGdDQUFBLEtBQW9DLEtBQXZDO1FBQ0UsSUFBUSxrQkFBQSxJQUFhLG1CQUFyQjtBQUFxQyxpQkFBTyxZQUE1QztTQUFBLE1BQ0ssSUFBRyxnQkFBSDtBQUFrQixpQkFBTyxxQkFBekI7U0FGUDtPQUFBLE1BR0ssSUFBRyxnQkFBQSxLQUFvQixLQUF2QjtRQUNILElBQUcsa0JBQUEsSUFBYSxtQkFBaEI7QUFBZ0MsaUJBQU8sYUFBdkM7U0FERztPQUFBLE1BRUEsSUFBRyxnQkFBQSxLQUFvQixLQUF2QjtRQUNILElBQUcsa0JBQUEsSUFBYSxtQkFBaEI7QUFBZ0MsaUJBQU8sbUJBQXZDO1NBREc7T0FBQSxNQUVBLElBQUcsZ0JBQUg7UUFDSCxJQUFHLHdDQUFBLEtBQTRDLEtBQS9DO0FBQ0UsaUJBQU8sY0FEVDtTQUFBLE1BRUssSUFBRyxpQ0FBQSxLQUFxQyxLQUF4QztBQUNILGlCQUFPLGtCQURKO1NBQUEsTUFFQSxJQUFHLHFCQUFBLEtBQXlCLEtBQXpCLElBQ04sNEJBQUEsS0FBZ0MsS0FEN0I7QUFFRCxpQkFBTyxXQUZOO1NBTEY7T0FBQSxNQVFBLElBQUcsZ0JBQUg7UUFDSCxJQUFHLHNDQUFBLEtBQTBDLEtBQTdDO0FBQ0UsaUJBQU8sZUFEVDtTQUFBLE1BRUssSUFBRywrQkFBQSxLQUFtQyxLQUF0QztBQUNILGlCQUFPLG1CQURKO1NBQUEsTUFFQSxJQUFHLHFCQUFBLEtBQXlCLEtBQXpCLElBQ04sNEJBQUEsS0FBZ0MsS0FEN0I7QUFFRCxpQkFBTyxZQUZOO1NBTEY7T0FBQSxNQVFBLElBQUcsaUJBQUg7UUFDSCxJQUFHLDZCQUFBLEtBQWlDLEtBQXBDO0FBQ0UsaUJBQU8sV0FEVDtTQURHO09BQUEsTUFHQSxJQUFHLGlCQUFIO1FBQ0gsSUFBRyw2QkFBQSxLQUFpQyxLQUFwQztBQUNFLGlCQUFPLGFBRFQ7U0FERztPQUFBLE1BR0EsSUFBRyxpQkFBSDtRQUNILElBQUcsZ0NBQUEsS0FBb0MsS0FBdkM7QUFDRSxpQkFBTyxNQURUO1NBREc7T0FBQSxNQUdBLElBQUcsaUJBQUg7UUFDSCxJQUFHLGdDQUFBLEtBQW9DLEtBQXZDO0FBQ0UsaUJBQU8sUUFEVDtTQURHO09BQUEsTUFHQSxJQUFHLGlCQUFIO1FBQ0gsSUFBRywyQkFBQSxLQUErQixLQUFsQztBQUNFLGlCQUFPLFlBRFQ7U0FERztPQUFBLE1BR0EsSUFBRyxpQkFBSDtRQUNILElBQUcsMkJBQUEsS0FBK0IsS0FBbEM7QUFDRSxpQkFBTyxlQURUO1NBREc7T0FBQSxNQUdBLElBQUcsaUJBQUg7UUFDSCxJQUFHLHlCQUFBLEtBQTZCLEtBQWhDO0FBQ0UsaUJBQU8sVUFEVDtTQURHO09BQUEsTUFHQSxJQUFHLGlCQUFIO1FBQ0gsSUFBRyxxQkFBQSxLQUF5QixLQUF6QixJQUNGLDBCQUFBLEtBQThCLEtBRDVCLElBRUYsb0NBQUEsS0FBd0MsS0FGekM7QUFHSSxpQkFBTyxXQUhYO1NBREc7T0FBQSxNQUtBLElBQUcsaUJBQUg7UUFDSCxJQUFHLHFCQUFBLEtBQXlCLEtBQXpCLElBQ0YsMEJBQUEsS0FBOEIsS0FENUIsSUFFRixvQ0FBQSxLQUF3QyxLQUZ6QztBQUdJLGlCQUFPLFlBSFg7U0FERztPQUFBLE1BS0EsSUFBRyxpQkFBSDtRQUNILElBQUcsdUNBQUEsS0FBMkMsS0FBOUM7QUFDRSxpQkFBTyxlQURUOztRQUVBLElBQUcscUNBQUEsS0FBeUMsS0FBNUM7QUFDRSxpQkFBTyxhQURUO1NBSEc7O0FBTUwsYUFBTztJQTlEQzs7eUJBa0VWLHNCQUFBLEdBQXdCLFNBQUMsR0FBRDtBQUN0QixVQUFBO01BQUEsSUFBQSxDQUFnQixHQUFoQjtBQUFBLGVBQU8sRUFBUDs7QUFDQSxXQUFXLGdGQUFYO1FBQ0UsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsR0FBN0I7UUFDUCxJQUErQyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBL0M7QUFBQSxpQkFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLEdBQWhDLEVBQVA7O0FBRkY7QUFHQSxhQUFPO0lBTGU7O3lCQVF4QixnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxJQUFHLENBQUksSUFBQyxDQUFBLE9BQVI7QUFBcUIsZUFBTyxJQUFDLENBQUEsc0JBQUQsQ0FBQSxFQUE1Qjs7TUFDQSxJQUFHLGdCQUFBLEdBQW1CLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQXRCO1FBQ0UsZ0JBQUEsR0FBbUIsSUFBSSxJQUFKLENBQVMsZ0JBQVQ7ZUFDbkIsSUFBQyxDQUFBLHNCQUFELENBQXdCLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixnQkFBZ0IsQ0FBQyxPQUFqQixDQUFBLENBQXJCLENBQXhCLEVBRkY7T0FBQSxNQUFBO2VBSUUsSUFBQyxDQUFBLHNCQUFELENBQXdCLEVBQXhCLEVBSkY7O0lBRmdCOzt5QkFTbEIsbUJBQUEsR0FBcUIsU0FBQTtBQUNuQixVQUFBO01BQUEsdUJBQUEsR0FBMEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFiLENBQTRCLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFBLENBQTVCO01BRTFCLElBQUcsa0NBQUg7ZUFDRSxJQUFJLENBQUMsSUFBTCxDQUFVLHVCQUF3QixDQUFBLENBQUEsQ0FBbEMsRUFBc0MsV0FBdEMsRUFERjs7SUFIbUI7O3lCQU9yQixXQUFBLEdBQWEsU0FBQTthQUNYLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFEQTs7eUJBSWIsU0FBQSxHQUFXLFNBQUE7YUFDVCxJQUFDLENBQUEsT0FBRCxHQUFXO0lBREY7O3lCQUlYLG1CQUFBLEdBQXFCLFNBQUMsWUFBRDtBQUVuQixVQUFBO01BQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSO01BRUwsSUFBRyxFQUFFLENBQUMsVUFBSCxDQUFjLFlBQWQsQ0FBSDtRQUNFLFdBQUEsR0FBYyxpQkFBQSxDQUFrQixFQUFFLENBQUMsWUFBSCxDQUFnQixZQUFoQixFQUE4QixNQUE5QixDQUFsQjtBQUNkO1VBRUUsSUFBQSxHQUFPLE9BQUEsQ0FBUSxTQUFSO1VBQ1AsV0FBQSxHQUFjLENBQUMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxXQUFkLENBQUQsQ0FBMkIsQ0FBQztVQUMxQyxJQUFHLFdBQUg7QUFBb0IsbUJBQU8sWUFBM0I7V0FKRjtTQUFBLGFBQUE7VUFLTTtVQUNKLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBbkIsQ0FBNEIsaUNBQUEsR0FBa0MsWUFBOUQsRUFDRTtZQUFBLFdBQUEsRUFBYSxJQUFiO1lBQ0EsTUFBQSxFQUFRLEVBQUEsR0FBRyxHQUFHLENBQUMsT0FEZjtXQURGLEVBTkY7U0FGRjs7QUFXQSxhQUFPO0lBZlk7O3lCQW9CckIsc0JBQUEsR0FBd0IsU0FBQyxXQUFEO0FBTXRCLFVBQUE7TUFBQSxtQkFBQSxHQUNFO1FBQUEsU0FBQSxFQUFXLENBQUMsQ0FBRCxFQUFHLENBQUgsQ0FBWDtRQUNBLGNBQUEsRUFBZ0IsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQURoQjtRQUVBLHlCQUFBLEVBQTJCO1VBQ3pCLENBRHlCLEVBRXpCO1lBQUEsV0FBQSxFQUFhLFVBQWI7WUFDQSxRQUFBLEVBQVUsVUFEVjtXQUZ5QjtTQUYzQjs7TUFRRixJQUFrQyxPQUFPLFdBQVAsS0FBc0IsUUFBeEQ7QUFBQSxlQUFPLG9CQUFQOztNQUVBLGlCQUFBLEdBQW9CO01BR3BCLElBQUEsR0FBTyxXQUFZLENBQUEsUUFBQTtNQUNuQixJQUFHLE9BQU8sSUFBUCxLQUFlLFFBQWYsSUFBMkIsT0FBTyxJQUFQLEtBQWUsUUFBN0M7UUFDRSxhQUFBLEdBQWlCLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBLEVBRHZDO09BQUEsTUFFSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFFBQWxCO1FBQ0gsSUFBRyxPQUFPLElBQUssQ0FBQSxDQUFBLENBQVosS0FBa0IsUUFBckI7VUFDRSxhQUFBLEdBQWlCLElBQUssQ0FBQSxDQUFBLENBQUwsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQSxFQUQ3QjtTQUFBLE1BQUE7VUFFSyxhQUFBLEdBQWlCLEVBRnRCO1NBREc7T0FBQSxNQUFBO1FBSUEsYUFBQSxHQUFpQixFQUpqQjs7TUFNTCxJQUFBLEdBQU8sV0FBWSxDQUFBLGtCQUFBO01BQ25CLElBQUcsT0FBTyxJQUFQLEtBQWUsUUFBZixJQUEyQixPQUFPLElBQVAsS0FBZSxRQUE3QztRQUNFLG1CQUFtQixDQUFDLFNBQVUsQ0FBQSxDQUFBLENBQTlCLEdBQW1DO1FBQ25DLG1CQUFtQixDQUFDLFNBQVUsQ0FBQSxDQUFBLENBQTlCLEdBQW1DLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBLEVBRnpEO09BQUEsTUFHSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFFBQWxCO1FBQ0gsbUJBQW1CLENBQUMsU0FBVSxDQUFBLENBQUEsQ0FBOUIsR0FBbUMsSUFBSyxDQUFBLENBQUE7UUFDeEMsSUFBRyxPQUFPLElBQUssQ0FBQSxDQUFBLENBQVosS0FBa0IsUUFBckI7VUFDRSxtQkFBbUIsQ0FBQyxTQUFVLENBQUEsQ0FBQSxDQUE5QixHQUFtQyxJQUFLLENBQUEsQ0FBQSxDQUFMLEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUEsRUFEL0M7U0FBQSxNQUFBO1VBRUssbUJBQW1CLENBQUMsU0FBVSxDQUFBLENBQUEsQ0FBOUIsR0FBbUMsRUFGeEM7U0FGRztPQUFBLE1BQUE7UUFLQSxtQkFBbUIsQ0FBQyxTQUFVLENBQUEsQ0FBQSxDQUE5QixHQUFtQyxjQUxuQzs7TUFPTCxJQUFBLEdBQU8sV0FBWSxDQUFBLHdCQUFBO01BQ25CLElBQUcsT0FBTyxJQUFQLEtBQWUsUUFBZixJQUEyQixPQUFPLElBQVAsS0FBZSxRQUE3QztRQUNFLG1CQUFtQixDQUFDLGNBQWUsQ0FBQSxDQUFBLENBQW5DLEdBQXdDO1FBQ3hDLG1CQUFtQixDQUFDLGNBQWUsQ0FBQSxDQUFBLENBQW5DLEdBQXdDLGlCQUFBLEdBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBLEVBRjlEO09BQUEsTUFHSyxJQUFHLE9BQU8sSUFBUCxLQUFlLFFBQWxCO1FBQ0gsbUJBQW1CLENBQUMsY0FBZSxDQUFBLENBQUEsQ0FBbkMsR0FBd0MsSUFBSyxDQUFBLENBQUE7UUFDN0MsSUFBRyxPQUFPLElBQUssQ0FBQSxDQUFBLENBQVosS0FBa0IsUUFBckI7VUFDRSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUFuQyxHQUF3QyxJQUFLLENBQUEsQ0FBQSxDQUFMLEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUEsRUFEcEQ7U0FBQSxNQUFBO1VBRUssbUJBQW1CLENBQUMsY0FBZSxDQUFBLENBQUEsQ0FBbkMsR0FBd0MsRUFGN0M7U0FGRztPQUFBLE1BQUE7UUFLQSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUFuQyxHQUF3QyxjQUx4Qzs7TUFPTCxJQUFBLEdBQU8sV0FBWSxDQUFBLG9DQUFBO01BQ25CLElBQUcsT0FBTyxJQUFQLEtBQWUsUUFBZixJQUEyQixPQUFPLElBQVAsS0FBZSxRQUE3QztRQUNFLG1CQUFtQixDQUFDLHlCQUEwQixDQUFBLENBQUEsQ0FBOUMsR0FBbUQsS0FEckQ7T0FBQSxNQUVLLElBQUcsT0FBTyxJQUFQLEtBQWUsUUFBbEI7UUFDSCxtQkFBbUIsQ0FBQyx5QkFBMEIsQ0FBQSxDQUFBLENBQTlDLEdBQW1ELElBQUssQ0FBQSxDQUFBO1FBQ3hELElBQUcsT0FBTyxJQUFLLENBQUEsQ0FBQSxDQUFaLEtBQWtCLFFBQXJCO1VBQ0UsbUJBQW1CLENBQUMseUJBQTBCLENBQUEsQ0FBQSxDQUFFLENBQUMsV0FBakQsR0FDRSxtQkFBbUIsQ0FBQyx5QkFBMEIsQ0FBQSxDQUFBLENBQUUsQ0FBQyxRQUFqRCxHQUNFLElBQUssQ0FBQSxDQUFBLEVBSFg7U0FBQSxNQUFBO1VBS0UsSUFBRywyQkFBSDtZQUNFLG1CQUFtQixDQUFDLHlCQUEwQixDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQWpELEdBQStELElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUR6RTs7VUFFQSxJQUFHLHdCQUFIO1lBQ0UsbUJBQW1CLENBQUMseUJBQTBCLENBQUEsQ0FBQSxDQUFFLENBQUMsUUFBakQsR0FBNEQsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLFNBRHRFO1dBUEY7U0FGRzs7QUFZTCxhQUFPO0lBbEVlOzt5QkFxRXhCLDZCQUFBLEdBQStCLFNBQUMsR0FBRDtBQUM3QixVQUFBO01BQUEsR0FBQTtNQUNBLElBQUEsQ0FBQSxDQUFvQixHQUFBLElBQU0sQ0FBMUIsQ0FBQTtBQUFBLGVBQU8sTUFBUDs7TUFDQSxJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixHQUE3QjtNQUNQLEtBQUEsR0FBUSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWI7TUFDUixJQUFnQixLQUFBLEtBQVMsSUFBekI7QUFBQSxlQUFPLE1BQVA7O01BQ0EsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0NBQVIsQ0FBeUMsQ0FBQyxHQUFELEVBQU0sS0FBSyxDQUFDLEtBQVosQ0FBekMsQ0FBNEQsQ0FBQyxjQUE3RCxDQUFBLENBQTZFLENBQUMsR0FBOUUsQ0FBQTtNQUNSLElBQWdCLEtBQUEsS0FBVyw2QkFBM0I7QUFBQSxlQUFPLE1BQVA7O0FBQ0EsYUFBTztJQVJzQjs7eUJBYS9CLHVCQUFBLEdBQXlCLFNBQUUsR0FBRixFQUFPLFNBQVAsRUFBa0Isa0JBQWxCO01BQ3ZCLElBQUcsSUFBQyxDQUFBLG1CQUFtQixDQUFDLHlCQUEwQixDQUFBLENBQUEsQ0FBbEQ7UUFDRSxJQUFHLGtCQUFBLEtBQXNCLFVBQXpCO2lCQUNFLElBQUMsQ0FBQSxTQUFELENBQVc7WUFBQyxHQUFBLEVBQUssR0FBTjtZQUFXLFdBQUEsRUFBYSxTQUFTLENBQUMsZ0JBQWxDO1dBQVgsRUFERjtTQUFBLE1BRUssSUFBRyxrQkFBQSxLQUFzQixXQUF6QjtpQkFDSCxJQUFDLENBQUEsU0FBRCxDQUFXO1lBQUMsR0FBQSxFQUFLLEdBQU47WUFBVyxXQUFBLEVBQWEsU0FBUyxDQUFDLG9CQUFsQztXQUFYLEVBREc7U0FBQSxNQUVBLElBQUcsa0JBQUEsS0FBc0IsVUFBekI7VUFJSCxJQUFHLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUF2QzttQkFDRSxJQUFDLENBQUEsU0FBRCxDQUFXO2NBQUMsR0FBQSxFQUFLLEdBQU47Y0FBWSxXQUFBLEVBQWEsU0FBUyxDQUFDLG9CQUFuQztjQUF5RCxjQUFBLEVBQWdCLENBQXpFO2FBQVgsRUFERjtXQUFBLE1BQUE7bUJBR0UsSUFBQyxDQUFBLFNBQUQsQ0FBVztjQUFDLEdBQUEsRUFBSyxHQUFOO2NBQVksV0FBQSxFQUFhLFNBQVMsQ0FBQyxvQkFBbkM7YUFBWCxFQUhGO1dBSkc7U0FBQSxNQVFBLElBQUcsa0JBQUEsS0FBc0IsWUFBekI7VUFDSCxJQUFHLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUF2QzttQkFDRSxJQUFDLENBQUEsU0FBRCxDQUFXO2NBQUMsR0FBQSxFQUFLLEdBQU47Y0FBWSxXQUFBLEVBQWEsU0FBUyxDQUFDLGdCQUFuQztjQUFvRCxjQUFBLEVBQWdCLENBQXBFO2FBQVgsRUFERjtXQUFBLE1BQUE7bUJBR0UsSUFBQyxDQUFBLFNBQUQsQ0FBVztjQUFDLEdBQUEsRUFBSyxHQUFOO2NBQVksV0FBQSxFQUFhLFNBQVMsQ0FBQyxnQkFBbkM7YUFBWCxFQUhGO1dBREc7U0FiUDs7SUFEdUI7O3lCQTBCekIsU0FBQSxHQUFXLFNBQUMsT0FBRDtBQUNULFVBQUE7TUFBRSxpQkFBRixFQUFPLHVEQUFQLEVBQStCLGlDQUEvQixFQUE0Qyw2QkFBNUMsRUFBdUQ7TUFDdkQsSUFBRyxJQUFDLENBQUEsYUFBRCxHQUFpQixDQUFwQjtBQUEyQixlQUFPLE1BQWxDOztNQUVBLElBQUcsU0FBSDtRQUNFLElBQUcsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFNBQVUsQ0FBQSxDQUFBLENBQWxDO1VBQ0UsSUFBRyxJQUFDLENBQUEsbUJBQW1CLENBQUMsU0FBVSxDQUFBLENBQUEsQ0FBbEM7WUFDRSxXQUFBLElBQWUsU0FBQSxHQUFZLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxTQUFVLENBQUEsQ0FBQSxFQUQ1RDtXQURGO1NBREY7O01BSUEsSUFBRyxjQUFIO1FBQ0UsSUFBRyxJQUFDLENBQUEsbUJBQW1CLENBQUMsY0FBZSxDQUFBLENBQUEsQ0FBdkM7VUFDRSxJQUFHLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxDQUF2QztZQUNFLFdBQUEsSUFBZSxjQUFBLEdBQWlCLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxjQUFlLENBQUEsQ0FBQSxFQUR0RTtXQURGO1NBREY7O01BT0EsSUFBRyxzQkFBSDtRQUNFLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxHQUFoQyxDQUFBLEdBQXVDLFdBQXZDLElBQ0QsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFnQyxHQUFoQyxDQUFBLEdBQXVDLFdBQUEsR0FBYyxzQkFEdkQ7VUFFSSxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQW1DLEdBQW5DLEVBQXdDLFdBQXhDLEVBQXFEO1lBQUUseUJBQUEsRUFBMkIsS0FBN0I7V0FBckQ7QUFDQSxpQkFBTyxLQUhYO1NBREY7T0FBQSxNQUFBO1FBTUUsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLEdBQWhDLENBQUEsS0FBMEMsV0FBN0M7VUFDRSxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQW1DLEdBQW5DLEVBQXdDLFdBQXhDLEVBQXFEO1lBQUUseUJBQUEsRUFBMkIsS0FBN0I7V0FBckQ7QUFDQSxpQkFBTyxLQUZUO1NBTkY7O0FBU0EsYUFBTztJQXhCRTs7Ozs7QUFyMEJiIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIEZpbGUsIFJhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5hdXRvQ29tcGxldGVKU1ggPSByZXF1aXJlICcuL2F1dG8tY29tcGxldGUtanN4J1xuRGlkSW5zZXJ0VGV4dCA9IHJlcXVpcmUgJy4vZGlkLWluc2VydC10ZXh0J1xuc3RyaXBKc29uQ29tbWVudHMgPSByZXF1aXJlICdzdHJpcC1qc29uLWNvbW1lbnRzJ1xuXG5cbk5PX1RPS0VOICAgICAgICAgICAgICAgID0gMFxuSlNYVEFHX1NFTEZDTE9TRV9TVEFSVCAgPSAxICAgICAgICMgdGhlIDx0YWcgaW4gPHRhZyAvPlxuSlNYVEFHX1NFTEZDTE9TRV9FTkQgICAgPSAyICAgICAgICMgdGhlIC8+IGluIDx0YWcgLz5cbkpTWFRBR19PUEVOICAgICAgICAgICAgID0gMyAgICAgICAjIHRoZSA8dGFnIGluIDx0YWc+PC90YWc+XG5KU1hUQUdfQ0xPU0VfQVRUUlMgICAgICA9IDQgICAgICAgIyB0aGUgMXN0ID4gaW4gPHRhZz48L3RhZz5cbkpTWFRBR19DTE9TRSAgICAgICAgICAgID0gNSAgICAgICAjIGEgPC90YWc+XG5KU1hCUkFDRV9PUEVOICAgICAgICAgICA9IDYgICAgICAgIyBlbWJlZGRlZCBleHByZXNzaW9uIGJyYWNlIHN0YXJ0IHtcbkpTWEJSQUNFX0NMT1NFICAgICAgICAgID0gNyAgICAgICAjIGVtYmVkZGVkIGV4cHJlc3Npb24gYnJhY2UgZW5kIH1cbkJSQUNFX09QRU4gICAgICAgICAgICAgID0gOCAgICAgICAjIEphdmFzY3JpcHQgYnJhY2VcbkJSQUNFX0NMT1NFICAgICAgICAgICAgID0gOSAgICAgICAjIEphdmFzY3JpcHQgYnJhY2VcblRFUk5BUllfSUYgICAgICAgICAgICAgID0gMTAgICAgICAjIFRlcm5hcnkgP1xuVEVSTkFSWV9FTFNFICAgICAgICAgICAgPSAxMSAgICAgICMgVGVybmFyeSA6XG5KU19JRiAgICAgICAgICAgICAgICAgICA9IDEyICAgICAgIyBKUyBJRlxuSlNfRUxTRSAgICAgICAgICAgICAgICAgPSAxMyAgICAgICMgSlMgRUxTRVxuU1dJVENIX0JSQUNFX09QRU4gICAgICAgPSAxNCAgICAgICMgb3BlbmluZyBicmFjZSBpbiBzd2l0Y2ggeyB9XG5TV0lUQ0hfQlJBQ0VfQ0xPU0UgICAgICA9IDE1ICAgICAgIyBjbG9zaW5nIGJyYWNlIGluIHN3aXRjaCB7IH1cblNXSVRDSF9DQVNFICAgICAgICAgICAgID0gMTYgICAgICAjIHN3aXRjaCBjYXNlIHN0YXRlbWVudFxuU1dJVENIX0RFRkFVTFQgICAgICAgICAgPSAxNyAgICAgICMgc3dpdGNoIGRlZmF1bHQgc3RhdGVtZW50XG5KU19SRVRVUk4gICAgICAgICAgICAgICA9IDE4ICAgICAgIyBKUyByZXR1cm5cblBBUkVOX09QRU4gICAgICAgICAgICAgID0gMTkgICAgICAjIHBhcmVuIG9wZW4gKFxuUEFSRU5fQ0xPU0UgICAgICAgICAgICAgPSAyMCAgICAgICMgcGFyZW4gY2xvc2UgKVxuVEVNUExBVEVfU1RBUlQgICAgICAgICAgPSAyMSAgICAgICMgYCBiYWNrLXRpY2sgc3RhcnRcblRFTVBMQVRFX0VORCAgICAgICAgICAgID0gMjIgICAgICAjIGAgYmFjay10aWNrIGVuZFxuXG4jIGVzbGludCBwcm9wZXJ0eSB2YWx1ZXNcblRBR0FMSUdORUQgICAgPSAndGFnLWFsaWduZWQnXG5MSU5FQUxJR05FRCAgID0gJ2xpbmUtYWxpZ25lZCdcbkFGVEVSUFJPUFMgICAgPSAnYWZ0ZXItcHJvcHMnXG5QUk9QU0FMSUdORUQgID0gJ3Byb3BzLWFsaWduZWQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEF1dG9JbmRlbnRcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuICAgIEBEaWRJbnNlcnRUZXh0ID0gbmV3IERpZEluc2VydFRleHQoQGVkaXRvcilcbiAgICBAYXV0b0pzeCA9IGF0b20uY29uZmlnLmdldCgnbGFuZ3VhZ2UtYmFiZWwnKS5hdXRvSW5kZW50SlNYXG4gICAgIyByZWdleCB0byBzZWFyY2ggZm9yIHRhZyBvcGVuL2Nsb3NlIHRhZyBhbmQgY2xvc2UgdGFnXG4gICAgQEpTWFJFR0VYUCA9IC8oPCkoWyRfQS1aYS16XSg/OlskXy46XFwtQS1aYS16MC05XSkqKXwoXFwvPil8KDxcXC8pKFskX0EtWmEtel0oPzpbJC5fOlxcLUEtWmEtejAtOV0pKikoPil8KD4pfCh7KXwofSl8KFxcPyl8KDopfChpZil8KGVsc2UpfChjYXNlKXwoZGVmYXVsdCl8KHJldHVybil8KFxcKCl8KFxcKSl8KGApfCg/Oig8KVxccyooPikpfCg8XFwvKSg+KS9nXG4gICAgQG1vdXNlVXAgPSB0cnVlXG4gICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlciA9IDFcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG4gICAgQHRlbXBsYXRlRGVwdGggPSAwICMgdHJhY2sgZGVwdGggb2YgYW55IGVtYmVkZGVkIGJhY2stdGljayB0ZW1wbGF0ZXNcblxuICAgICMgT2JzZXJ2ZSBhdXRvSW5kZW50SlNYIGZvciBleGlzdGluZyBlZGl0b3JzXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbmZpZy5vYnNlcnZlICdsYW5ndWFnZS1iYWJlbC5hdXRvSW5kZW50SlNYJyxcbiAgICAgICh2YWx1ZSkgPT4gQGF1dG9Kc3ggPSB2YWx1ZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6YXV0by1pbmRlbnQtanN4LW9uJzogKGV2ZW50KSA9PlxuICAgICAgICBAYXV0b0pzeCA9IHRydWVcbiAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMgPSBAZ2V0SW5kZW50T3B0aW9ucygpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdsYW5ndWFnZS1iYWJlbDphdXRvLWluZGVudC1qc3gtb2ZmJzogKGV2ZW50KSA9PiAgQGF1dG9Kc3ggPSBmYWxzZVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAnbGFuZ3VhZ2UtYmFiZWw6dG9nZ2xlLWF1dG8taW5kZW50LWpzeCc6IChldmVudCkgPT5cbiAgICAgICAgQGF1dG9Kc3ggPSBub3QgQGF1dG9Kc3hcbiAgICAgICAgaWYgQGF1dG9Kc3ggdGhlbiBAZXNsaW50SW5kZW50T3B0aW9ucyA9IEBnZXRJbmRlbnRPcHRpb25zKClcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEBlZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbiAoZXZlbnQpID0+IEBjaGFuZ2VkQ3Vyc29yUG9zaXRpb24oZXZlbnQpXG4gICAgQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nKClcblxuICBkZXN0cm95OiAoKSAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIEBvbk1vdXNlRG93blxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBAb25Nb3VzZVVwXG5cbiAgIyBjaGFuZ2VkIGN1cnNvciBwb3NpdGlvblxuICBjaGFuZ2VkQ3Vyc29yUG9zaXRpb246IChldmVudCkgPT5cbiAgICByZXR1cm4gdW5sZXNzIEBhdXRvSnN4XG4gICAgcmV0dXJuIHVubGVzcyBAbW91c2VVcFxuICAgIHJldHVybiB1bmxlc3MgZXZlbnQub2xkQnVmZmVyUG9zaXRpb24ucm93IGlzbnQgZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgYnVmZmVyUm93ID0gZXZlbnQubmV3QnVmZmVyUG9zaXRpb24ucm93XG4gICAgIyBoYW5kbGUgbXVsdGlwbGUgY3Vyc29ycy4gb25seSB0cmlnZ2VyIGluZGVudCBvbiBvbmUgY2hhbmdlIGV2ZW50XG4gICAgIyBhbmQgdGhlbiBvbmx5IGF0IHRoZSBoaWdoZXN0IHJvd1xuICAgIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICAgIGN1cnNvclBvc2l0aW9ucyA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcbiAgICAgIGlmIGN1cnNvclBvc2l0aW9ucy5sZW5ndGggaXMgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlclxuICAgICAgICBAbXVsdGlwbGVDdXJzb3JUcmlnZ2VyID0gMVxuICAgICAgICBidWZmZXJSb3cgPSAwXG4gICAgICAgIGZvciBjdXJzb3JQb3NpdGlvbiBpbiBjdXJzb3JQb3NpdGlvbnNcbiAgICAgICAgICBpZiBjdXJzb3JQb3NpdGlvbi5yb3cgPiBidWZmZXJSb3cgdGhlbiBidWZmZXJSb3cgPSBjdXJzb3JQb3NpdGlvbi5yb3dcbiAgICAgIGVsc2VcbiAgICAgICAgQG11bHRpcGxlQ3Vyc29yVHJpZ2dlcisrXG4gICAgICAgIHJldHVyblxuICAgIGVsc2UgY3Vyc29yUG9zaXRpb24gPSBldmVudC5uZXdCdWZmZXJQb3NpdGlvblxuXG4gICAgIyByZW1vdmUgYW55IGJsYW5rIGxpbmVzIGZyb20gd2hlcmUgY3Vyc29yIHdhcyBwcmV2aW91c2x5XG4gICAgcHJldmlvdXNSb3cgPSBldmVudC5vbGRCdWZmZXJQb3NpdGlvbi5yb3dcbiAgICBpZiBAanN4SW5TY29wZShwcmV2aW91c1JvdylcbiAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwcmV2aW91c1JvdykpP1swXS5sZW5ndGhcbiAgICAgIGlmIGJsYW5rTGluZUVuZFBvcz9cbiAgICAgICAgQGluZGVudFJvdyh7cm93OiBwcmV2aW91c1JvdyAsIGJsb2NrSW5kZW50OiAwIH0pXG5cbiAgICByZXR1cm4gaWYgbm90IEBqc3hJblNjb3BlIGJ1ZmZlclJvd1xuXG4gICAgZW5kUG9pbnRPZkpzeCA9IG5ldyBQb2ludCBidWZmZXJSb3csMCAjIG5leHQgcm93IHN0YXJ0XG4gICAgc3RhcnRQb2ludE9mSnN4ID0gIGF1dG9Db21wbGV0ZUpTWC5nZXRTdGFydE9mSlNYIEBlZGl0b3IsIGN1cnNvclBvc2l0aW9uXG4gICAgQGluZGVudEpTWCBuZXcgUmFuZ2Uoc3RhcnRQb2ludE9mSnN4LCBlbmRQb2ludE9mSnN4KVxuICAgIGNvbHVtblRvTW92ZVRvID0gL15cXHMqJC8uZXhlYyhAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGJ1ZmZlclJvdykpP1swXS5sZW5ndGhcbiAgICBpZiBjb2x1bW5Ub01vdmVUbz8gdGhlbiBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uIFtidWZmZXJSb3csIGNvbHVtblRvTW92ZVRvXVxuXG5cbiAgIyBCdWZmZXIgaGFzIHN0b3BwZWQgY2hhbmdpbmcuIEluZGVudCBhcyByZXF1aXJlZFxuICBkaWRTdG9wQ2hhbmdpbmc6ICgpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYXV0b0pzeFxuICAgIHJldHVybiB1bmxlc3MgQG1vdXNlVXBcbiAgICBzZWxlY3RlZFJhbmdlID0gQGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICAjIGlmIHRoaXMgaXMgYSB0YWcgc3RhcnQncyBlbmQgPiBvciA8LyB0aGVuIGRvbid0IGF1dG8gaW5kZW50XG4gICAgIyB0aGlzIGlhIGZpeCB0byBhbGxvdyBmb3IgdGhlIGF1dG8gY29tcGxldGUgdGFnIHRpbWUgdG8gcG9wIHVwXG4gICAgaWYgc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3cgaXMgc2VsZWN0ZWRSYW5nZS5lbmQucm93IGFuZFxuICAgICAgc2VsZWN0ZWRSYW5nZS5zdGFydC5jb2x1bW4gaXMgc2VsZWN0ZWRSYW5nZS5lbmQuY29sdW1uXG4gICAgICAgIHJldHVybiBpZiAnSlNYU3RhcnRUYWdFbmQnIGluIEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW3NlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLnN0YXJ0LmNvbHVtbl0pLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgcmV0dXJuIGlmICdKU1hFbmRUYWdTdGFydCcgaW4gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbc2VsZWN0ZWRSYW5nZS5zdGFydC5yb3csIHNlbGVjdGVkUmFuZ2Uuc3RhcnQuY29sdW1uXSkuZ2V0U2NvcGVzQXJyYXkoKVxuXG4gICAgaGlnaGVzdFJvdyA9IE1hdGgubWF4IHNlbGVjdGVkUmFuZ2Uuc3RhcnQucm93LCBzZWxlY3RlZFJhbmdlLmVuZC5yb3dcbiAgICBsb3dlc3RSb3cgPSBNYXRoLm1pbiBzZWxlY3RlZFJhbmdlLnN0YXJ0LnJvdywgc2VsZWN0ZWRSYW5nZS5lbmQucm93XG5cbiAgICAjIHJlbW92ZSB0aGUgaGFuZGxlciBmb3IgZGlkU3RvcENoYW5naW5nIHRvIGF2b2lkIHRoaXMgY2hhbmdlIGNhdXNpbmcgYSBuZXcgZXZlbnRcbiAgICBAb25EaWRTdG9wQ2hhbmdpbmdIYW5kbGVyLmRpc3Bvc2UoKVxuXG4gICAgIyB3b3JrIGJhY2t3YXJkcyB0aHJvdWdoIGJ1ZmZlciByb3dzIGluZGVudGluZyBKU1ggYXMgbmVlZGVkXG4gICAgd2hpbGUgKCBoaWdoZXN0Um93ID49IGxvd2VzdFJvdyApXG4gICAgICBpZiBAanN4SW5TY29wZShoaWdoZXN0Um93KVxuICAgICAgICBlbmRQb2ludE9mSnN4ID0gbmV3IFBvaW50IGhpZ2hlc3RSb3csMFxuICAgICAgICBzdGFydFBvaW50T2ZKc3ggPSAgYXV0b0NvbXBsZXRlSlNYLmdldFN0YXJ0T2ZKU1ggQGVkaXRvciwgZW5kUG9pbnRPZkpzeFxuICAgICAgICBAaW5kZW50SlNYIG5ldyBSYW5nZShzdGFydFBvaW50T2ZKc3gsIGVuZFBvaW50T2ZKc3gpXG4gICAgICAgIGhpZ2hlc3RSb3cgPSBzdGFydFBvaW50T2ZKc3gucm93IC0gMVxuICAgICAgZWxzZSBoaWdoZXN0Um93ID0gaGlnaGVzdFJvdyAtIDFcblxuICAgICMgcmVuYWJsZSB0aGlzIGV2ZW50IGhhbmRsZXIgYWZ0ZXIgMzAwbXMgYXMgcGVyIHRoZSBkZWZhdWx0IHRpbWVvdXQgZm9yIGNoYW5nZSBldmVudHNcbiAgICAjIHRvIGF2b2lkIHRoaXMgbWV0aG9kIGJlaW5nIHJlY2FsbGVkIVxuICAgIHNldFRpbWVvdXQoQGhhbmRsZU9uRGlkU3RvcENoYW5naW5nLCAzMDApXG4gICAgcmV0dXJuXG5cbiAgaGFuZGxlT25EaWRTdG9wQ2hhbmdpbmc6ID0+XG4gICAgQG9uRGlkU3RvcENoYW5naW5nSGFuZGxlciA9IEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcgKCkgPT4gQGRpZFN0b3BDaGFuZ2luZygpXG5cbiAgIyBpcyB0aGUganN4IG9uIHRoaXMgbGluZSBpbiBzY29wZVxuICBqc3hJblNjb3BlOiAoYnVmZmVyUm93KSAtPlxuICAgIHNjb3BlcyA9IEBlZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oW2J1ZmZlclJvdywgMF0pLmdldFNjb3Blc0FycmF5KClcbiAgICByZXR1cm4gJ21ldGEudGFnLmpzeCcgaW4gc2NvcGVzXG5cbiAgIyBpbmRlbnQgdGhlIEpTWCBpbiB0aGUgJ3JhbmdlJyBvZiByb3dzXG4gICMgVGhpcyBpcyBkZXNpZ25lZCB0byBiZSBhIHNpbmdsZSBwYXJzZSBpbmRlbnRlciB0byByZWR1Y2UgdGhlIGltcGFjdCBvbiB0aGUgZWRpdG9yLlxuICAjIEl0IGFzc3VtZXMgdGhlIGdyYW1tYXIgaGFzIGRvbmUgaXRzIGpvYiBhZGRpbmcgc2NvcGVzIHRvIGludGVyZXN0aW5nIHRva2Vucy5cbiAgIyBUaG9zZSBhcmUgSlNYIDx0YWcsID4sIDwvdGFnLCAvPiwgZW1lZGRlZCBleHByZXNzaW9uc1xuICAjIG91dHNpZGUgdGhlIHRhZyBzdGFydGluZyB7IGFuZCBlbmRpbmcgfSBhbmQgamF2YXNjcmlwdCBicmFjZXMgb3V0c2lkZSBhIHRhZyB7ICYgfVxuICAjIGl0IHVzZXMgYW4gYXJyYXkgdG8gaG9sZCB0b2tlbnMgYW5kIGEgcHVzaC9wb3Agc3RhY2sgdG8gaG9sZCB0b2tlbnMgbm90IGNsb3NlZFxuICAjIHRoZSB2ZXJ5IGZpcnN0IGpzeCB0YWcgbXVzdCBiZSBjb3JyZXRseSBpbmRldGVkIGJ5IHRoZSB1c2VyIGFzIHdlIGRvbid0IGhhdmVcbiAgIyBrbm93bGVkZ2Ugb2YgcHJlY2VlZGluZyBKYXZhc2NyaXB0LlxuICBpbmRlbnRKU1g6IChyYW5nZSkgLT5cbiAgICB0b2tlblN0YWNrID0gW11cbiAgICBpZHhPZlRva2VuID0gMFxuICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4gPSBbXSAjIGxlbmd0aCBlcXVpdmFsZW50IHRvIHRva2VuIGRlcHRoXG4gICAgaW5kZW50ID0gIDBcbiAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDBcbiAgICBAdGVtcGxhdGVEZXB0aCA9IDBcblxuICAgIGZvciByb3cgaW4gW3JhbmdlLnN0YXJ0LnJvdy4ucmFuZ2UuZW5kLnJvd11cbiAgICAgIGlzRmlyc3RUb2tlbk9mTGluZSA9IHRydWVcbiAgICAgIHRva2VuT25UaGlzTGluZSA9IGZhbHNlXG4gICAgICBpbmRlbnRSZWNhbGMgPSBmYWxzZVxuICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICAwXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcblxuICAgICAgIyBsb29rIGZvciB0b2tlbnMgaW4gYSBidWZmZXIgbGluZVxuICAgICAgd2hpbGUgKCggbWF0Y2ggPSBASlNYUkVHRVhQLmV4ZWMobGluZSkpIGlzbnQgbnVsbCApXG4gICAgICAgIG1hdGNoQ29sdW1uID0gbWF0Y2guaW5kZXhcbiAgICAgICAgbWF0Y2hQb2ludFN0YXJ0ID0gbmV3IFBvaW50KHJvdywgbWF0Y2hDb2x1bW4pXG4gICAgICAgIG1hdGNoUG9pbnRFbmQgPSBuZXcgUG9pbnQocm93LCBtYXRjaENvbHVtbiArIG1hdGNoWzBdLmxlbmd0aCAtIDEpXG4gICAgICAgIG1hdGNoUmFuZ2UgPSBuZXcgUmFuZ2UobWF0Y2hQb2ludFN0YXJ0LCBtYXRjaFBvaW50RW5kKVxuXG4gICAgICAgIGlmIHJvdyBpcyByYW5nZS5zdGFydC5yb3cgYW5kIG1hdGNoQ29sdW1uIDwgcmFuZ2Uuc3RhcnQuY29sdW1uIHRoZW4gY29udGludWVcbiAgICAgICAgaWYgbm90IHRva2VuID0gIEBnZXRUb2tlbihyb3csIG1hdGNoKSB0aGVuIGNvbnRpbnVlXG5cbiAgICAgICAgZmlyc3RDaGFySW5kZW50YXRpb24gPSAoQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyByb3cpXG4gICAgICAgICMgY29udmVydCB0aGUgbWF0Y2hlZCBjb2x1bW4gcG9zaXRpb24gaW50byB0YWIgaW5kZW50c1xuICAgICAgICBpZiBAZWRpdG9yLmdldFNvZnRUYWJzKClcbiAgICAgICAgICB0b2tlbkluZGVudGF0aW9uID0gKG1hdGNoQ29sdW1uIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKSlcbiAgICAgICAgZWxzZSB0b2tlbkluZGVudGF0aW9uID1cbiAgICAgICAgICBkbyAoQGVkaXRvcikgLT5cbiAgICAgICAgICAgIGhhcmRUYWJzRm91bmQgPSBjaGFyc0ZvdW5kID0gMFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5tYXRjaENvbHVtbl1cbiAgICAgICAgICAgICAgaWYgKChsaW5lLnN1YnN0ciBpLCAxKSBpcyAnXFx0JylcbiAgICAgICAgICAgICAgICBoYXJkVGFic0ZvdW5kKytcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNoYXJzRm91bmQrK1xuICAgICAgICAgICAgcmV0dXJuIGhhcmRUYWJzRm91bmQgKyAoIGNoYXJzRm91bmQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpIClcblxuICAgICAgICAjIGJpZyBzd2l0Y2ggc3RhdGVtZW50IGZvbGxvd3MgZm9yIGVhY2ggdG9rZW4uIElmIHRoZSBsaW5lIGlzIHJlZm9ybWF0ZWRcbiAgICAgICAgIyB0aGVuIHdlIHJlY2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24uXG4gICAgICAgICMgYml0IGhvcnJpZCBidXQgaG9wZWZ1bGx5IGZhc3QuXG4gICAgICAgIHN3aXRjaCAodG9rZW4pXG4gICAgICAgICAgIyB0YWdzIHN0YXJ0aW5nIDx0YWdcbiAgICAgICAgICB3aGVuIEpTWFRBR19PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICAjIGluZGVudCBvbmx5IG9uIGZpcnN0IHRva2VuIG9mIGEgbGluZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgIyBpc0ZpcnN0VGFnT2ZCbG9jayBpcyB1c2VkIHRvIG1hcmsgdGhlIHRhZyB0aGF0IHN0YXJ0cyB0aGUgSlNYIGJ1dFxuICAgICAgICAgICAgICAjIGFsc28gdGhlIGZpcnN0IHRhZyBvZiBibG9ja3MgaW5zaWRlICBlbWJlZGRlZCBleHByZXNzaW9ucy4gZS5nLlxuICAgICAgICAgICAgICAjIDx0Ym9keT4sIDxwQ29tcD4gYW5kIDxvYmplY3RSb3c+IGFyZSBmaXJzdCB0YWdzXG4gICAgICAgICAgICAgICMgcmV0dXJuIChcbiAgICAgICAgICAgICAgIyAgICAgICA8dGJvZHkgY29tcD17PHBDb21wIHByb3BlcnR5IC8+fT5cbiAgICAgICAgICAgICAgIyAgICAgICAgIHtvYmplY3RzLm1hcChmdW5jdGlvbihvYmplY3QsIGkpe1xuICAgICAgICAgICAgICAjICAgICAgICAgICByZXR1cm4gPE9iamVjdFJvdyBvYmo9e29iamVjdH0ga2V5PXtpfSAvPjtcbiAgICAgICAgICAgICAgIyAgICAgICAgIH0pfVxuICAgICAgICAgICAgICAjICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICMgICAgIClcbiAgICAgICAgICAgICAgIyBidXQgd2UgZG9uJ3QgcG9zaXRpb24gdGhlIDx0Ym9keT4gYXMgd2UgaGF2ZSBubyBrbm93bGVkZ2Ugb2YgdGhlIHByZWNlZWRpbmdcbiAgICAgICAgICAgICAgIyBqcyBzeW50YXhcbiAgICAgICAgICAgICAgaWYgaXNGaXJzdFRhZ09mQmxvY2sgYW5kXG4gICAgICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeD8gYW5kXG4gICAgICAgICAgICAgICAgICAoIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgQlJBQ0VfT1BFTiBvclxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hCUkFDRV9PUEVOIClcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbiA9ICB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uID1cbiAgICAgICAgICAgICAgICAgICAgICBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gKyB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZCBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93ICwgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDF9KVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX09QRU5cbiAgICAgICAgICAgICAgbmFtZTogbWF0Y2hbMl1cbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyA8L3RhZz5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRVxuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFXG4gICAgICAgICAgICAgIG5hbWU6IG1hdGNoWzVdXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIHBhcmVudFRva2VuSWR4OiBwYXJlbnRUb2tlbklkeCAgICAgICAgICMgcHRyIHRvIDx0YWdcbiAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4ID49MCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0YWdzIGVuZGluZyAvPlxuICAgICAgICAgIHdoZW4gSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICNpZiBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uIGlzIGZpcnN0Q2hhckluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRGb3JDbG9zaW5nQnJhY2tldCAgcm93LFxuICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLFxuICAgICAgICAgICAgICAgIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0uc2VsZkNsb3NpbmdcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICAgICAgICAgICAgbmFtZTogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0ubmFtZVxuICAgICAgICAgICAgICByb3c6IHJvd1xuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHggICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMFxuICAgICAgICAgICAgICB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCA9IGlkeE9mVG9rZW5cbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSA9IEpTWFRBR19TRUxGQ0xPU0VfU1RBUlRcbiAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIHRhZ3MgZW5kaW5nID5cbiAgICAgICAgICB3aGVuIEpTWFRBR19DTE9TRV9BVFRSU1xuICAgICAgICAgICAgdG9rZW5PblRoaXNMaW5lID0gdHJ1ZVxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgI2lmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb24gaXMgZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudEZvckNsb3NpbmdCcmFja2V0ICByb3csXG4gICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0sXG4gICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5ub25FbXB0eVxuXG4gICAgICAgICAgICAjIHJlLXBhcnNlIGxpbmUgaWYgaW5kZW50IGRpZCBzb21ldGhpbmcgdG8gaXRcbiAgICAgICAgICAgIGlmIGluZGVudFJlY2FsY1xuICAgICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgICAgICAgICAgQEpTWFJFR0VYUC5sYXN0SW5kZXggPSAwICNmb3JjZSByZWdleCB0byBzdGFydCBhZ2FpblxuICAgICAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IGZhbHNlXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgICAgICAgICAgIG5hbWU6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLm5hbWVcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgaWYgcGFyZW50VG9rZW5JZHggPj0gMCB0aGVuIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4ID0gaWR4T2ZUb2tlblxuICAgICAgICAgICAgaWR4T2ZUb2tlbisrXG5cbiAgICAgICAgICAjIGVtYmVkZWQgZXhwcmVzc2lvbiBzdGFydCB7XG4gICAgICAgICAgd2hlbiBKU1hCUkFDRV9PUEVOXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgICBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIEpTWFRBR19PUEVOIGFuZCB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxfSApXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyB0ZXJuYXJ5IHN0YXJ0XG4gICAgICAgICAgd2hlbiBURVJOQVJZX0lGXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiBpc0ZpcnN0VG9rZW5PZkxpbmVcbiAgICAgICAgICAgICAgIyBpcyB0aGlzIHRlcm5hcnkgc3RhcnRpbmcgYSBuZXcgbGluZVxuICAgICAgICAgICAgICBpZiBmaXJzdENoYXJJbmRlbnRhdGlvbiBpcyB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBAZ2V0SW5kZW50T2ZQcmV2aW91c1Jvdyhyb3cpLCBqc3hJbmRlbnQ6IDF9KVxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBKU1hUQUdfT1BFTiBhbmQgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHggaXMgbnVsbFxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMX0pXG4gICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMX0gKVxuXG5cbiAgICAgICAgICAgICMgcmUtcGFyc2UgbGluZSBpZiBpbmRlbnQgZGlkIHNvbWV0aGluZyB0byBpdFxuICAgICAgICAgICAgaWYgaW5kZW50UmVjYWxjXG4gICAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IHJvd1xuICAgICAgICAgICAgICBASlNYUkVHRVhQLmxhc3RJbmRleCA9IDAgI2ZvcmNlIHJlZ2V4IHRvIHN0YXJ0IGFnYWluXG4gICAgICAgICAgICAgIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGlzRmlyc3RUYWdPZkJsb2NrID0gdHJ1ZSAgIyB0aGlzIG1heSBiZSB0aGUgc3RhcnQgb2YgYSBuZXcgSlNYIGJsb2NrXG4gICAgICAgICAgICBpc0ZpcnN0VG9rZW5PZkxpbmUgPSBmYWxzZVxuXG4gICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBlbWJlZGVkIGV4cHJlc3Npb24gZW5kIH1cbiAgICAgICAgICB3aGVuIEpTWEJSQUNFX0NMT1NFLCBURVJOQVJZX0VMU0VcbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcblxuICAgICAgICAgICAgaWYgaXNGaXJzdFRva2VuT2ZMaW5lXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaW5kZW50UmVjYWxjID0gQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuXG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSBmYWxzZVxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gb3BlbmluZyB0b2tlblxuXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBTdGFydCB7IG9yIHN3aXRjaCBicmFjZSBzdGFydCB7IG9yIHBhcmVuICggb3IgYmFjay10aWNrIGBzdGFydFxuICAgICAgICAgIHdoZW4gQlJBQ0VfT1BFTiwgU1dJVENIX0JSQUNFX09QRU4sIFBBUkVOX09QRU4sIFRFTVBMQVRFX1NUQVJUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9TVEFSVCB0aGVuIEB0ZW1wbGF0ZURlcHRoKytcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIGlzRmlyc3RUYWdPZkJsb2NrIGFuZFxuICAgICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg/IGFuZFxuICAgICAgICAgICAgICAgICAgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyB0b2tlbiBhbmRcbiAgICAgICAgICAgICAgICAgIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnJvdyBpcyAoIHJvdyAtIDEpXG4gICAgICAgICAgICAgICAgICAgIHRva2VuSW5kZW50YXRpb24gPSBmaXJzdENoYXJJbmRlbnRhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdICsgQGdldEluZGVudE9mUHJldmlvdXNSb3cgcm93XG4gICAgICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogZmlyc3RDaGFySW5kZW50YXRpb259KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4PyBhbmQgQHRlcm5hcnlUZXJtaW5hdGVzUHJldmlvdXNMaW5lKHJvdylcbiAgICAgICAgICAgICAgICBmaXJzdFRhZ0luTGluZUluZGVudGF0aW9uID0gIHRva2VuSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbiA9IEBnZXRJbmRlbnRPZlByZXZpb3VzUm93KHJvdylcbiAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdyAsIGJsb2NrSW5kZW50OiBmaXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgICAgICAgICBlbHNlIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9IClcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgIHR5cGU6IHRva2VuXG4gICAgICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgIGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb246IGZpcnN0VGFnSW5MaW5lSW5kZW50YXRpb25cbiAgICAgICAgICAgICAgdG9rZW5JbmRlbnRhdGlvbjogdG9rZW5JbmRlbnRhdGlvblxuICAgICAgICAgICAgICBmaXJzdENoYXJJbmRlbnRhdGlvbjogZmlyc3RDaGFySW5kZW50YXRpb25cbiAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4XG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ3NBdHRyaWJ1dGVzSWR4OiBudWxsICAjIHB0ciB0byA+IHRhZ1xuICAgICAgICAgICAgICB0ZXJtc1RoaXNUYWdJZHg6IG51bGwgICAgICAgICAgICAgIyBwdHIgdG8gPC90YWc+XG5cbiAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBpZHhPZlRva2VuXG4gICAgICAgICAgICBpZHhPZlRva2VuKytcblxuICAgICAgICAgICMgSmF2YXNjcmlwdCBicmFjZSBFbmQgfSBvciBzd2l0Y2ggYnJhY2UgZW5kIH0gb3IgcGFyZW4gY2xvc2UgKSBvciBiYWNrLXRpY2sgYCBlbmRcbiAgICAgICAgICB3aGVuIEJSQUNFX0NMT1NFLCBTV0lUQ0hfQlJBQ0VfQ0xPU0UsIFBBUkVOX0NMT1NFLCBURU1QTEFURV9FTkRcblxuICAgICAgICAgICAgaWYgdG9rZW4gaXMgU1dJVENIX0JSQUNFX0NMT1NFXG4gICAgICAgICAgICAgIHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucHVzaCBwYXJlbnRUb2tlbklkeCA9IHN0YWNrT2ZUb2tlbnNTdGlsbE9wZW4ucG9wKClcbiAgICAgICAgICAgICAgaWYgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfQ0FTRSBvciB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAjIHNvIG5vdyB3ZSBhcmUgYXQgdGhlIHN3aXRjaCdzIGNsb3NlIGJyYWNlIHdlIHBvcCBvZmYgYW55IGNhc2UvZGVmYXVsdCB0b2tlbnNcbiAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG5cbiAgICAgICAgICAgIHRva2VuT25UaGlzTGluZSA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGluZGVudFJlY2FsYyA9IEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24gfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeD9cbiAgICAgICAgICAgICAgdG9rZW5TdGFjay5wdXNoXG4gICAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICAgICAgICAgIHJvdzogcm93XG4gICAgICAgICAgICAgICAgcGFyZW50VG9rZW5JZHg6IHBhcmVudFRva2VuSWR4ICAgICAgICAgIyBwdHIgdG8gPHRhZ1xuICAgICAgICAgICAgICBpZiBwYXJlbnRUb2tlbklkeCA+PTAgdGhlbiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50ZXJtc1RoaXNUYWdJZHggPSBpZHhPZlRva2VuXG4gICAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgICBpZiB0b2tlbiBpcyBURU1QTEFURV9FTkQgdGhlbiBAdGVtcGxhdGVEZXB0aC0tXG5cbiAgICAgICAgICAjIGNhc2UsIGRlZmF1bHQgc3RhdGVtZW50IG9mIHN3aXRjaFxuICAgICAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgICAgICB0b2tlbk9uVGhpc0xpbmUgPSB0cnVlXG4gICAgICAgICAgICBpc0ZpcnN0VGFnT2ZCbG9jayA9IHRydWVcbiAgICAgICAgICAgIGlmIGlzRmlyc3RUb2tlbk9mTGluZVxuICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnB1c2ggcGFyZW50VG9rZW5JZHggPSBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgIGlmIHBhcmVudFRva2VuSWR4P1xuICAgICAgICAgICAgICAgIGlmIHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLnR5cGUgaXMgU1dJVENIX0NBU0Ugb3IgdG9rZW5TdGFja1twYXJlbnRUb2tlbklkeF0udHlwZSBpcyBTV0lUQ0hfREVGQVVMVFxuICAgICAgICAgICAgICAgICAgIyB3ZSBvbmx5IGFsbG93IGEgc2luZ2xlIGNhc2UvZGVmYXVsdCBzdGFjayBlbGVtZW50IHBlciBzd2l0Y2ggaW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICMgc28gcG9zaXRpb24gbmV3IGNhc2UvZGVmYXVsdCB0byB0aGUgbGFzdCBvbmVzIHBvc2l0aW9uIGFuZCB0aGVuIHBvcCB0aGUgbGFzdCdzXG4gICAgICAgICAgICAgICAgICAjIG9mZiB0aGUgc3RhY2suXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uIH0pXG4gICAgICAgICAgICAgICAgICBzdGFja09mVG9rZW5zU3RpbGxPcGVuLnBvcCgpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XS50eXBlIGlzIFNXSVRDSF9CUkFDRV9PUEVOXG4gICAgICAgICAgICAgICAgICBpbmRlbnRSZWNhbGMgPSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuU3RhY2tbcGFyZW50VG9rZW5JZHhdLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcblxuICAgICAgICAgICAgIyByZS1wYXJzZSBsaW5lIGlmIGluZGVudCBkaWQgc29tZXRoaW5nIHRvIGl0XG4gICAgICAgICAgICBpZiBpbmRlbnRSZWNhbGNcbiAgICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cgcm93XG4gICAgICAgICAgICAgIEBKU1hSRUdFWFAubGFzdEluZGV4ID0gMCAjZm9yY2UgcmVnZXggdG8gc3RhcnQgYWdhaW5cbiAgICAgICAgICAgICAgY29udGludWVcblxuICAgICAgICAgICAgaXNGaXJzdFRva2VuT2ZMaW5lID0gZmFsc2VcblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuXG4gICAgICAgICAgICB0b2tlblN0YWNrLnB1c2hcbiAgICAgICAgICAgICAgdHlwZTogdG9rZW5cbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgICAgcm93OiByb3dcbiAgICAgICAgICAgICAgZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvbjogZmlyc3RUYWdJbkxpbmVJbmRlbnRhdGlvblxuICAgICAgICAgICAgICB0b2tlbkluZGVudGF0aW9uOiB0b2tlbkluZGVudGF0aW9uXG4gICAgICAgICAgICAgIGZpcnN0Q2hhckluZGVudGF0aW9uOiBmaXJzdENoYXJJbmRlbnRhdGlvblxuICAgICAgICAgICAgICBwYXJlbnRUb2tlbklkeDogcGFyZW50VG9rZW5JZHhcbiAgICAgICAgICAgICAgdGVybXNUaGlzVGFnc0F0dHJpYnV0ZXNJZHg6IG51bGwgICMgcHRyIHRvID4gdGFnXG4gICAgICAgICAgICAgIHRlcm1zVGhpc1RhZ0lkeDogbnVsbCAgICAgICAgICAgICAjIHB0ciB0byA8L3RhZz5cblxuICAgICAgICAgICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIGlkeE9mVG9rZW5cbiAgICAgICAgICAgIGlkeE9mVG9rZW4rK1xuXG4gICAgICAgICAgIyBUZXJuYXJ5IGFuZCBjb25kaXRpb25hbCBpZi9lbHNlIG9wZXJhdG9yc1xuICAgICAgICAgIHdoZW4gSlNfSUYsIEpTX0VMU0UsIEpTX1JFVFVSTlxuICAgICAgICAgICAgaXNGaXJzdFRhZ09mQmxvY2sgPSB0cnVlXG5cbiAgICAgICMgaGFuZGxlIGxpbmVzIHdpdGggbm8gdG9rZW4gb24gdGhlbVxuICAgICAgaWYgaWR4T2ZUb2tlbiBhbmQgbm90IHRva2VuT25UaGlzTGluZVxuICAgICAgICAjIGluZGVudCBsaW5lcyBidXQgcmVtb3ZlIGFueSBibGFuayBsaW5lcyB3aXRoIHdoaXRlIHNwYWNlIGV4Y2VwdCB0aGUgbGFzdCByb3dcbiAgICAgICAgaWYgcm93IGlzbnQgcmFuZ2UuZW5kLnJvd1xuICAgICAgICAgIGJsYW5rTGluZUVuZFBvcyA9IC9eXFxzKiQvLmV4ZWMoQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpKT9bMF0ubGVuZ3RoXG4gICAgICAgICAgaWYgYmxhbmtMaW5lRW5kUG9zP1xuICAgICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3cgLCBibG9ja0luZGVudDogMCB9KVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmRlbnRVbnRva2VuaXNlZExpbmUgcm93LCB0b2tlblN0YWNrLCBzdGFja09mVG9rZW5zU3RpbGxPcGVuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAaW5kZW50VW50b2tlbmlzZWRMaW5lIHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlblxuXG5cbiAgIyBpbmRlbnQgYW55IGxpbmVzIHRoYXQgaGF2ZW4ndCBhbnkgaW50ZXJlc3RpbmcgdG9rZW5zXG4gIGluZGVudFVudG9rZW5pc2VkTGluZTogKHJvdywgdG9rZW5TdGFjaywgc3RhY2tPZlRva2Vuc1N0aWxsT3BlbiApIC0+XG4gICAgc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wdXNoIHBhcmVudFRva2VuSWR4ID0gc3RhY2tPZlRva2Vuc1N0aWxsT3Blbi5wb3AoKVxuICAgIHJldHVybiBpZiBub3QgcGFyZW50VG9rZW5JZHg/XG4gICAgdG9rZW4gPSB0b2tlblN0YWNrW3BhcmVudFRva2VuSWR4XVxuICAgIHN3aXRjaCB0b2tlbi50eXBlXG4gICAgICB3aGVuIEpTWFRBR19PUEVOLCBKU1hUQUdfU0VMRkNMT1NFX1NUQVJUXG4gICAgICAgIGlmICB0b2tlbi50ZXJtc1RoaXNUYWdzQXR0cmlidXRlc0lkeCBpcyBudWxsXG4gICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlbi5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50UHJvcHM6IDEgfSlcbiAgICAgICAgZWxzZSBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEgfSlcbiAgICAgIHdoZW4gSlNYQlJBQ0VfT1BFTiwgVEVSTkFSWV9JRlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBCUkFDRV9PUEVOLCBTV0lUQ0hfQlJBQ0VfT1BFTiwgUEFSRU5fT1BFTlxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHRva2VuLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnQ6IDEsIGFsbG93QWRkaXRpb25hbEluZGVudHM6IHRydWV9KVxuICAgICAgd2hlbiBKU1hUQUdfU0VMRkNMT1NFX0VORCwgSlNYQlJBQ0VfQ0xPU0UsIEpTWFRBR19DTE9TRV9BVFRSUywgVEVSTkFSWV9FTFNFXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW5TdGFja1t0b2tlbi5wYXJlbnRUb2tlbklkeF0uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudFByb3BzOiAxfSlcbiAgICAgIHdoZW4gQlJBQ0VfQ0xPU0UsIFNXSVRDSF9CUkFDRV9DTE9TRSwgUEFSRU5fQ0xPU0VcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiB0b2tlblN0YWNrW3Rva2VuLnBhcmVudFRva2VuSWR4XS5maXJzdENoYXJJbmRlbnRhdGlvbiwganN4SW5kZW50OiAxLCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzOiB0cnVlfSlcbiAgICAgIHdoZW4gU1dJVENIX0NBU0UsIFNXSVRDSF9ERUZBVUxUXG4gICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCBibG9ja0luZGVudDogdG9rZW4uZmlyc3RDaGFySW5kZW50YXRpb24sIGpzeEluZGVudDogMSB9KVxuICAgICAgd2hlbiBURU1QTEFURV9TVEFSVCwgVEVNUExBVEVfRU5EXG4gICAgICAgIHJldHVybjsgIyBkb24ndCB0b3VjaCB0ZW1wbGF0ZXNcblxuICAjIGdldCB0aGUgdG9rZW4gYXQgdGhlIGdpdmVuIG1hdGNoIHBvc2l0aW9uIG9yIHJldHVybiB0cnV0aHkgZmFsc2VcbiAgZ2V0VG9rZW46IChidWZmZXJSb3csIG1hdGNoKSAtPlxuICAgIHNjb3BlID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUm93LCBtYXRjaC5pbmRleF0pLmdldFNjb3Blc0FycmF5KCkucG9wKClcbiAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi50YWcuanN4JyBpcyBzY29wZVxuICAgICAgaWYgICAgICBtYXRjaFsxXT8gb3IgbWF0Y2hbMjBdPyB0aGVuIHJldHVybiBKU1hUQUdfT1BFTlxuICAgICAgZWxzZSBpZiBtYXRjaFszXT8gdGhlbiByZXR1cm4gSlNYVEFHX1NFTEZDTE9TRV9FTkRcbiAgICBlbHNlIGlmICdKU1hFbmRUYWdTdGFydCcgaXMgc2NvcGVcbiAgICAgIGlmIG1hdGNoWzRdPyBvciBtYXRjaFsyMl0/IHRoZW4gcmV0dXJuIEpTWFRBR19DTE9TRVxuICAgIGVsc2UgaWYgJ0pTWFN0YXJ0VGFnRW5kJyBpcyBzY29wZVxuICAgICAgaWYgbWF0Y2hbN10/IG9yIG1hdGNoWzIxXT8gdGhlbiByZXR1cm4gSlNYVEFHX0NMT1NFX0FUVFJTXG4gICAgZWxzZSBpZiBtYXRjaFs4XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmJlZ2luLmpzeCcgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIEpTWEJSQUNFX09QRU5cbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuc3dpdGNoU3RhcnQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfT1BFTlxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5qcycgaXMgc2NvcGUgb3JcbiAgICAgICAgJ21ldGEuYnJhY2UuY3VybHkubGl0b2JqLmpzJyBpcyBzY29wZVxuICAgICAgICAgIHJldHVybiBCUkFDRV9PUEVOXG4gICAgZWxzZSBpZiBtYXRjaFs5XT9cbiAgICAgIGlmICdwdW5jdHVhdGlvbi5zZWN0aW9uLmVtYmVkZGVkLmVuZC5qc3gnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU1hCUkFDRV9DTE9TRVxuICAgICAgZWxzZSBpZiAnbWV0YS5icmFjZS5jdXJseS5zd2l0Y2hFbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBTV0lUQ0hfQlJBQ0VfQ0xPU0VcbiAgICAgIGVsc2UgaWYgJ21ldGEuYnJhY2UuY3VybHkuanMnIGlzIHNjb3BlIG9yXG4gICAgICAgICdtZXRhLmJyYWNlLmN1cmx5LmxpdG9iai5qcycgaXMgc2NvcGVcbiAgICAgICAgICByZXR1cm4gQlJBQ0VfQ0xPU0VcbiAgICBlbHNlIGlmIG1hdGNoWzEwXT9cbiAgICAgIGlmICdrZXl3b3JkLm9wZXJhdG9yLnRlcm5hcnkuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURVJOQVJZX0lGXG4gICAgZWxzZSBpZiBtYXRjaFsxMV0/XG4gICAgICBpZiAna2V5d29yZC5vcGVyYXRvci50ZXJuYXJ5LmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gVEVSTkFSWV9FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxMl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmNvbmRpdGlvbmFsLmpzJyBpcyBzY29wZVxuICAgICAgICByZXR1cm4gSlNfSUZcbiAgICBlbHNlIGlmIG1hdGNoWzEzXT9cbiAgICAgIGlmICdrZXl3b3JkLmNvbnRyb2wuY29uZGl0aW9uYWwuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19FTFNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNF0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9DQVNFXG4gICAgZWxzZSBpZiBtYXRjaFsxNV0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLnN3aXRjaC5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFNXSVRDSF9ERUZBVUxUXG4gICAgZWxzZSBpZiBtYXRjaFsxNl0/XG4gICAgICBpZiAna2V5d29yZC5jb250cm9sLmZsb3cuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBKU19SRVRVUk5cbiAgICBlbHNlIGlmIG1hdGNoWzE3XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX09QRU5cbiAgICBlbHNlIGlmIG1hdGNoWzE4XT9cbiAgICAgIGlmICdtZXRhLmJyYWNlLnJvdW5kLmpzJyBpcyBzY29wZSBvclxuICAgICAgICdtZXRhLmJyYWNlLnJvdW5kLmdyYXBocWwnIGlzIHNjb3BlIG9yXG4gICAgICAgJ21ldGEuYnJhY2Uucm91bmQuZGlyZWN0aXZlLmdyYXBocWwnIGlzIHNjb3BlXG4gICAgICAgICAgcmV0dXJuIFBBUkVOX0NMT1NFXG4gICAgZWxzZSBpZiBtYXRjaFsxOV0/XG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5iZWdpbi5qcycgaXMgc2NvcGVcbiAgICAgICAgcmV0dXJuIFRFTVBMQVRFX1NUQVJUXG4gICAgICBpZiAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5xdWFzaS5lbmQuanMnIGlzIHNjb3BlXG4gICAgICAgIHJldHVybiBURU1QTEFURV9FTkRcblxuICAgIHJldHVybiBOT19UT0tFTlxuXG5cbiAgIyBnZXQgaW5kZW50IG9mIHRoZSBwcmV2aW91cyByb3cgd2l0aCBjaGFycyBpbiBpdFxuICBnZXRJbmRlbnRPZlByZXZpb3VzUm93OiAocm93KSAtPlxuICAgIHJldHVybiAwIHVubGVzcyByb3dcbiAgICBmb3Igcm93IGluIFtyb3ctMS4uLjBdXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICAgIHJldHVybiBAZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93IHJvdyBpZiAgLy4qXFxTLy50ZXN0IGxpbmVcbiAgICByZXR1cm4gMFxuXG4gICMgZ2V0IGVzbGludCB0cmFuc2xhdGVkIGluZGVudCBvcHRpb25zXG4gIGdldEluZGVudE9wdGlvbnM6ICgpIC0+XG4gICAgaWYgbm90IEBhdXRvSnN4IHRoZW4gcmV0dXJuIEB0cmFuc2xhdGVJbmRlbnRPcHRpb25zKClcbiAgICBpZiBlc2xpbnRyY0ZpbGVuYW1lID0gQGdldEVzbGludHJjRmlsZW5hbWUoKVxuICAgICAgZXNsaW50cmNGaWxlbmFtZSA9IG5ldyBGaWxlKGVzbGludHJjRmlsZW5hbWUpXG4gICAgICBAdHJhbnNsYXRlSW5kZW50T3B0aW9ucyhAcmVhZEVzbGludHJjT3B0aW9ucyhlc2xpbnRyY0ZpbGVuYW1lLmdldFBhdGgoKSkpXG4gICAgZWxzZVxuICAgICAgQHRyYW5zbGF0ZUluZGVudE9wdGlvbnMoe30pICMgZ2V0IGRlZmF1bHRzXG5cbiAgIyByZXR1cm4gdGV4dCBzdHJpbmcgb2YgYSBwcm9qZWN0IGJhc2VkIC5lc2xpbnRyYyBmaWxlIGlmIG9uZSBleGlzdHNcbiAgZ2V0RXNsaW50cmNGaWxlbmFtZTogKCkgLT5cbiAgICBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZSA9IGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aCBAZWRpdG9yLmdldFBhdGgoKVxuICAgICMgSXMgdGhlIHNvdXJjZUZpbGUgbG9jYXRlZCBpbnNpZGUgYW4gQXRvbSBwcm9qZWN0IGZvbGRlcj9cbiAgICBpZiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXT9cbiAgICAgIHBhdGguam9pbiBwcm9qZWN0Q29udGFpbmluZ1NvdXJjZVswXSwgJy5lc2xpbnRyYydcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VEb3duOiAoKSA9PlxuICAgIEBtb3VzZVVwID0gZmFsc2VcblxuICAjIG1vdXNlIHN0YXRlXG4gIG9uTW91c2VVcDogKCkgPT5cbiAgICBAbW91c2VVcCA9IHRydWVcblxuICAjIHRvIGNyZWF0ZSBpbmRlbnRzLiBXZSBjYW4gcmVhZCBhbmQgcmV0dXJuIHRoZSBydWxlcyBwcm9wZXJ0aWVzIG9yIHVuZGVmaW5lZFxuICByZWFkRXNsaW50cmNPcHRpb25zOiAoZXNsaW50cmNGaWxlKSAtPlxuICAgICMgRXhwZW5zaXZlIGRlcGVuZGVuY3k6IHVzZSBhIGxhenkgcmVxdWlyZS5cbiAgICBmcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG4gICAgIyBnZXQgbG9jYWwgcGF0aCBvdmVyaWRlc1xuICAgIGlmIGZzLmlzRmlsZVN5bmMgZXNsaW50cmNGaWxlXG4gICAgICBmaWxlQ29udGVudCA9IHN0cmlwSnNvbkNvbW1lbnRzKGZzLnJlYWRGaWxlU3luYyhlc2xpbnRyY0ZpbGUsICd1dGY4JykpXG4gICAgICB0cnlcbiAgICAgICAgIyBFeHBlbnNpdmUgZGVwZW5kZW5jeTogdXNlIGEgbGF6eSByZXF1aXJlLlxuICAgICAgICBZQU1MID0gcmVxdWlyZSAnanMteWFtbCdcbiAgICAgICAgZXNsaW50UnVsZXMgPSAoWUFNTC5zYWZlTG9hZCBmaWxlQ29udGVudCkucnVsZXNcbiAgICAgICAgaWYgZXNsaW50UnVsZXMgdGhlbiByZXR1cm4gZXNsaW50UnVsZXNcbiAgICAgIGNhdGNoIGVyclxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgXCJMQjogRXJyb3IgcmVhZGluZyAuZXNsaW50cmMgYXQgI3tlc2xpbnRyY0ZpbGV9XCIsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICBkZXRhaWw6IFwiI3tlcnIubWVzc2FnZX1cIlxuICAgIHJldHVybiB7fVxuXG4gICMgdXNlIGVzbGludCByZWFjdCBmb3JtYXQgZGVzY3JpYmVkIGF0IGh0dHA6Ly90aW55dXJsLmNvbS9wNG10YXR2XG4gICMgdHVybiBzcGFjZXMgaW50byB0YWIgZGltZW5zaW9ucyB3aGljaCBjYW4gYmUgZGVjaW1hbFxuICAjIGEgZW1wdHkgb2JqZWN0IGFyZ3VtZW50IHBhcnNlcyBiYWNrIHRoZSBkZWZhdWx0IHNldHRpbmdzXG4gIHRyYW5zbGF0ZUluZGVudE9wdGlvbnM6IChlc2xpbnRSdWxlcykgLT5cbiAgICAjIEVzbGludCBydWxlcyB0byB1c2UgYXMgZGVmYXVsdCBvdmVyaWRkZW4gYnkgLmVzbGludHJjXG4gICAgIyBOLkIuIHRoYXQgdGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgdGhlIGVzbGludCBydWxlcyBpbiB0aGF0XG4gICAgIyB0aGUgdGFiLXNwYWNlcyBhbmQgJ3RhYidzIGluIGVzbGludHJjIGFyZSBjb252ZXJ0ZWQgdG8gdGFicyBiYXNlZCB1cG9uXG4gICAgIyB0aGUgQXRvbSBlZGl0b3IgdGFiIHNwYWNpbmcuXG4gICAgIyBlLmcuIGVzbGludCBpbmRlbnQgWzEsNF0gd2l0aCBhbiBBdG9tIHRhYiBzcGFjaW5nIG9mIDIgYmVjb21lcyBpbmRlbnQgWzEsMl1cbiAgICBlc2xpbnRJbmRlbnRPcHRpb25zICA9XG4gICAgICBqc3hJbmRlbnQ6IFsxLDFdICAgICAgICAgICAgIyAxID0gZW5hYmxlZCwgMT0jdGFic1xuICAgICAganN4SW5kZW50UHJvcHM6IFsxLDFdICAgICAgICMgMSA9IGVuYWJsZWQsIDE9I3RhYnNcbiAgICAgIGpzeENsb3NpbmdCcmFja2V0TG9jYXRpb246IFtcbiAgICAgICAgMSxcbiAgICAgICAgc2VsZkNsb3Npbmc6IFRBR0FMSUdORURcbiAgICAgICAgbm9uRW1wdHk6IFRBR0FMSUdORURcbiAgICAgIF1cblxuICAgIHJldHVybiBlc2xpbnRJbmRlbnRPcHRpb25zIHVubGVzcyB0eXBlb2YgZXNsaW50UnVsZXMgaXMgXCJvYmplY3RcIlxuXG4gICAgRVNfREVGQVVMVF9JTkRFTlQgPSA0ICMgZGVmYXVsdCBlc2xpbnQgaW5kZW50IGFzIHNwYWNlc1xuXG4gICAgIyByZWFkIGluZGVudCBpZiBpdCBleGlzdHMgYW5kIHVzZSBpdCBhcyB0aGUgZGVmYXVsdCBpbmRlbnQgZm9yIEpTWFxuICAgIHJ1bGUgPSBlc2xpbnRSdWxlc1snaW5kZW50J11cbiAgICBpZiB0eXBlb2YgcnVsZSBpcyAnbnVtYmVyJyBvciB0eXBlb2YgcnVsZSBpcyAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdEluZGVudCAgPSBFU19ERUZBVUxUX0lOREVOVCAvIEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBlbHNlIGlmIHR5cGVvZiBydWxlIGlzICdvYmplY3QnXG4gICAgICBpZiB0eXBlb2YgcnVsZVsxXSBpcyAnbnVtYmVyJ1xuICAgICAgICBkZWZhdWx0SW5kZW50ICA9IHJ1bGVbMV0gLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgICBlbHNlIGRlZmF1bHRJbmRlbnQgID0gMVxuICAgIGVsc2UgZGVmYXVsdEluZGVudCAgPSAxXG5cbiAgICBydWxlID0gZXNsaW50UnVsZXNbJ3JlYWN0L2pzeC1pbmRlbnQnXVxuICAgIGlmIHR5cGVvZiBydWxlIGlzICdudW1iZXInIG9yIHR5cGVvZiBydWxlIGlzICdzdHJpbmcnXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFswXSA9IHJ1bGVcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdID0gRVNfREVGQVVMVF9JTkRFTlQgLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgZWxzZSBpZiB0eXBlb2YgcnVsZSBpcyAnb2JqZWN0J1xuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMF0gPSBydWxlWzBdXG4gICAgICBpZiB0eXBlb2YgcnVsZVsxXSBpcyAnbnVtYmVyJ1xuICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXSA9IHJ1bGVbMV0gLyBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzFdID0gMVxuICAgIGVsc2UgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRbMV0gPSBkZWZhdWx0SW5kZW50XG5cbiAgICBydWxlID0gZXNsaW50UnVsZXNbJ3JlYWN0L2pzeC1pbmRlbnQtcHJvcHMnXVxuICAgIGlmIHR5cGVvZiBydWxlIGlzICdudW1iZXInIG9yIHR5cGVvZiBydWxlIGlzICdzdHJpbmcnXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzBdID0gcnVsZVxuICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1sxXSA9IEVTX0RFRkFVTFRfSU5ERU5UIC8gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgIGVsc2UgaWYgdHlwZW9mIHJ1bGUgaXMgJ29iamVjdCdcbiAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMF0gPSBydWxlWzBdXG4gICAgICBpZiB0eXBlb2YgcnVsZVsxXSBpcyAnbnVtYmVyJ1xuICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzFdID0gcnVsZVsxXSAvIEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICAgIGVsc2UgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1sxXSA9IDFcbiAgICBlbHNlIGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV0gPSBkZWZhdWx0SW5kZW50XG5cbiAgICBydWxlID0gZXNsaW50UnVsZXNbJ3JlYWN0L2pzeC1jbG9zaW5nLWJyYWNrZXQtbG9jYXRpb24nXVxuICAgIGlmIHR5cGVvZiBydWxlIGlzICdudW1iZXInIG9yIHR5cGVvZiBydWxlIGlzICdzdHJpbmcnXG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMF0gPSBydWxlXG4gICAgZWxzZSBpZiB0eXBlb2YgcnVsZSBpcyAnb2JqZWN0JyAjIGFycmF5XG4gICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMF0gPSBydWxlWzBdXG4gICAgICBpZiB0eXBlb2YgcnVsZVsxXSBpcyAnc3RyaW5nJ1xuICAgICAgICBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeENsb3NpbmdCcmFja2V0TG9jYXRpb25bMV0uc2VsZkNsb3NpbmcgPVxuICAgICAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5ub25FbXB0eSA9XG4gICAgICAgICAgICBydWxlWzFdXG4gICAgICBlbHNlXG4gICAgICAgIGlmIHJ1bGVbMV0uc2VsZkNsb3Npbmc/XG4gICAgICAgICAgZXNsaW50SW5kZW50T3B0aW9ucy5qc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uWzFdLnNlbGZDbG9zaW5nID0gcnVsZVsxXS5zZWxmQ2xvc2luZ1xuICAgICAgICBpZiBydWxlWzFdLm5vbkVtcHR5P1xuICAgICAgICAgIGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblsxXS5ub25FbXB0eSA9IHJ1bGVbMV0ubm9uRW1wdHlcblxuICAgIHJldHVybiBlc2xpbnRJbmRlbnRPcHRpb25zXG5cbiAgIyBkb2VzIHRoZSBwcmV2aW91cyBsaW5lIHRlcm1pbmF0ZSB3aXRoIGEgdGVybmFyeSBlbHNlIDpcbiAgdGVybmFyeVRlcm1pbmF0ZXNQcmV2aW91c0xpbmU6IChyb3cpIC0+XG4gICAgcm93LS1cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHJvdyA+PTBcbiAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyByb3dcbiAgICBtYXRjaCA9IC86XFxzKiQvLmV4ZWMobGluZSlcbiAgICByZXR1cm4gZmFsc2UgaWYgbWF0Y2ggaXMgbnVsbFxuICAgIHNjb3BlID0gQGVkaXRvci5zY29wZURlc2NyaXB0b3JGb3JCdWZmZXJQb3NpdGlvbihbcm93LCBtYXRjaC5pbmRleF0pLmdldFNjb3Blc0FycmF5KCkucG9wKClcbiAgICByZXR1cm4gZmFsc2UgaWYgc2NvcGUgaXNudCAna2V5d29yZC5vcGVyYXRvci50ZXJuYXJ5LmpzJ1xuICAgIHJldHVybiB0cnVlXG5cbiAgIyBhbGxpZ24gbm9uRW1wdHkgYW5kIHNlbGZDbG9zaW5nIHRhZ3MgYmFzZWQgb24gZXNsaW50IHJ1bGVzXG4gICMgcm93IHRvIGJlIGluZGVudGVkIGJhc2VkIHVwb24gYSBwYXJlbnRUYWdzIHByb3BlcnRpZXMgYW5kIGEgcnVsZSB0eXBlXG4gICMgcmV0dXJucyBpbmRlbnRSb3cncyByZXR1cm4gdmFsdWVcbiAgaW5kZW50Rm9yQ2xvc2luZ0JyYWNrZXQ6ICggcm93LCBwYXJlbnRUYWcsIGNsb3NpbmdCcmFja2V0UnVsZSApIC0+XG4gICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvblswXVxuICAgICAgaWYgY2xvc2luZ0JyYWNrZXRSdWxlIGlzIFRBR0FMSUdORURcbiAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csIGJsb2NrSW5kZW50OiBwYXJlbnRUYWcudG9rZW5JbmRlbnRhdGlvbn0pXG4gICAgICBlbHNlIGlmIGNsb3NpbmdCcmFja2V0UnVsZSBpcyBMSU5FQUxJR05FRFxuICAgICAgICBAaW5kZW50Um93KHtyb3c6IHJvdywgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy5maXJzdENoYXJJbmRlbnRhdGlvbiB9KVxuICAgICAgZWxzZSBpZiBjbG9zaW5nQnJhY2tldFJ1bGUgaXMgQUZURVJQUk9QU1xuICAgICAgICAjIHRoaXMgcmVhbGx5IGlzbid0IHZhbGlkIGFzIHRoaXMgdGFnIHNob3VsZG4ndCBiZSBvbiBhIGxpbmUgYnkgaXRzZWxmXG4gICAgICAgICMgYnV0IEkgZG9uJ3QgcmVmb3JtYXQgbGluZXMganVzdCBpbmRlbnQhXG4gICAgICAgICMgaW5kZW50IHRvIG1ha2UgaXQgbG9vayBPSyBhbHRob3VnaCBpdCB3aWxsIGZhaWwgZXNsaW50XG4gICAgICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFByb3BzWzBdXG4gICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csICBibG9ja0luZGVudDogcGFyZW50VGFnLmZpcnN0Q2hhckluZGVudGF0aW9uLCBqc3hJbmRlbnRQcm9wczogMSB9KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGluZGVudFJvdyh7cm93OiByb3csICBibG9ja0luZGVudDogcGFyZW50VGFnLmZpcnN0Q2hhckluZGVudGF0aW9ufSlcbiAgICAgIGVsc2UgaWYgY2xvc2luZ0JyYWNrZXRSdWxlIGlzIFBST1BTQUxJR05FRFxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy50b2tlbkluZGVudGF0aW9uLGpzeEluZGVudFByb3BzOiAxfSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBpbmRlbnRSb3coe3Jvdzogcm93LCAgYmxvY2tJbmRlbnQ6IHBhcmVudFRhZy50b2tlbkluZGVudGF0aW9ufSlcblxuICAjIGluZGVudCBhIHJvdyBieSB0aGUgYWRkaXRpb24gb2Ygb25lIG9yIG1vcmUgaW5kZW50cy5cbiAgIyByZXR1cm5zIGZhbHNlIGlmIG5vIGluZGVudCByZXF1aXJlZCBhcyBpdCBpcyBhbHJlYWR5IGNvcnJlY3RcbiAgIyByZXR1cm4gdHJ1ZSBpZiBpbmRlbnQgd2FzIHJlcXVpcmVkXG4gICMgYmxvY2tJbmRlbnQgaXMgdGhlIGluZGVudCB0byB0aGUgc3RhcnQgb2YgdGhpcyBsb2dpY2FsIGpzeCBibG9ja1xuICAjIG90aGVyIGluZGVudHMgYXJlIHRoZSByZXF1aXJlZCBpbmRlbnQgYmFzZWQgb24gZXNsaW50IGNvbmRpdGlvbnMgZm9yIFJlYWN0XG4gICMgb3B0aW9uIGNvbnRhaW5zIHJvdyB0byBpbmRlbnQgYW5kIGFsbG93QWRkaXRpb25hbEluZGVudHMgZmxhZ1xuICBpbmRlbnRSb3c6IChvcHRpb25zKSAtPlxuICAgIHsgcm93LCBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzLCBibG9ja0luZGVudCwganN4SW5kZW50LCBqc3hJbmRlbnRQcm9wcyB9ID0gb3B0aW9uc1xuICAgIGlmIEB0ZW1wbGF0ZURlcHRoID4gMCB0aGVuIHJldHVybiBmYWxzZSAjIGRvbid0IGluZGVudCBpbnNpZGUgYSB0ZW1wbGF0ZVxuICAgICMgY2FsYyBvdmVyYWxsIGluZGVudFxuICAgIGlmIGpzeEluZGVudFxuICAgICAgaWYgQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50WzBdXG4gICAgICAgIGlmIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXVxuICAgICAgICAgIGJsb2NrSW5kZW50ICs9IGpzeEluZGVudCAqIEBlc2xpbnRJbmRlbnRPcHRpb25zLmpzeEluZGVudFsxXVxuICAgIGlmIGpzeEluZGVudFByb3BzXG4gICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1swXVxuICAgICAgICBpZiBAZXNsaW50SW5kZW50T3B0aW9ucy5qc3hJbmRlbnRQcm9wc1sxXVxuICAgICAgICAgIGJsb2NrSW5kZW50ICs9IGpzeEluZGVudFByb3BzICogQGVzbGludEluZGVudE9wdGlvbnMuanN4SW5kZW50UHJvcHNbMV1cbiAgICAjIGFsbG93QWRkaXRpb25hbEluZGVudHMgYWxsb3dzIGluZGVudHMgdG8gYmUgZ3JlYXRlciB0aGFuIHRoZSBtaW5pbXVtXG4gICAgIyB1c2VkIHdoZXJlIGl0ZW1zIGFyZSBhbGlnbmVkIGJ1dCBubyBlc2xpbnQgcnVsZXMgYXJlIGFwcGxpY2FibGVcbiAgICAjIHNvIHVzZXIgaGFzIHNvbWUgZGlzY3JldGlvbiBpbiBhZGRpbmcgbW9yZSBpbmRlbnRzXG4gICAgaWYgYWxsb3dBZGRpdGlvbmFsSW5kZW50c1xuICAgICAgaWYgQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhyb3cpIDwgYmxvY2tJbmRlbnQgb3JcbiAgICAgICAgQGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyhyb3cpID4gYmxvY2tJbmRlbnQgKyBhbGxvd0FkZGl0aW9uYWxJbmRlbnRzXG4gICAgICAgICAgQGVkaXRvci5zZXRJbmRlbnRhdGlvbkZvckJ1ZmZlclJvdyByb3csIGJsb2NrSW5kZW50LCB7IHByZXNlcnZlTGVhZGluZ1doaXRlc3BhY2U6IGZhbHNlIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGlmIEBlZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cocm93KSBpc250IGJsb2NrSW5kZW50XG4gICAgICAgIEBlZGl0b3Iuc2V0SW5kZW50YXRpb25Gb3JCdWZmZXJSb3cgcm93LCBibG9ja0luZGVudCwgeyBwcmVzZXJ2ZUxlYWRpbmdXaGl0ZXNwYWNlOiBmYWxzZSB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG4iXX0=
