(function() {
  var AutoIndent, Point, Range, fs, path, ref;

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  fs = require('fs-plus');

  path = require('path');

  AutoIndent = require('../lib/auto-indent');

  describe('auto-indent', function() {
    var autoIndent, editor, indentJSXRange, notifications, ref1, sourceCode, sourceCodeRange;
    ref1 = [], autoIndent = ref1[0], editor = ref1[1], notifications = ref1[2], sourceCode = ref1[3], sourceCodeRange = ref1[4], indentJSXRange = ref1[5];
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('language-babel');
      });
    });
    beforeEach(function() {
      waitsForPromise(function() {
        return atom.workspace.open('non-existent.js').then(function(o) {
          return editor = o;
        });
      });
      return runs(function() {
        autoIndent = new AutoIndent(editor);
        return notifications = atom.notifications;
      });
    });
    describe('::constructor', function() {
      return it(' should setup some valid indentation defaults', function() {
        var expectedResult;
        expectedResult = {
          jsxIndent: [1, 1],
          jsxIndentProps: [1, 1],
          jsxClosingBracketLocation: [
            1, {
              selfClosing: 'tag-aligned',
              nonEmpty: 'tag-aligned'
            }
          ]
        };
        return expect(autoIndent.eslintIndentOptions).toEqual(expectedResult);
      });
    });
    describe('::getEslintrcFilename', function() {
      it('returns a correct project path for the source file', function() {
        return expect(path.dirname(autoIndent.getEslintrcFilename())).toEqual(path.dirname(editor.getPath()));
      });
      return it('returns a .eslintrc file name', function() {
        return expect(path.basename(autoIndent.getEslintrcFilename())).toEqual('.eslintrc');
      });
    });
    return describe('::readEslintrcOptions', function() {
      it('returns an empty object on a missing .eslintrc', function() {
        return expect(autoIndent.readEslintrcOptions('.missing')).toEqual({});
      });
      it('returns and empty Object and a notification message on bad eslint', function() {
        var obj;
        spyOn(fs, 'existsSync').andReturn(true);
        spyOn(fs, 'readFileSync').andReturn('{');
        spyOn(notifications, 'addError').andCallThrough();
        obj = autoIndent.readEslintrcOptions();
        expect(notifications.addError).toHaveBeenCalled();
        return expect(obj).toEqual({});
      });
      it('returns an empty Object when eslint with no rules is read', function() {
        var obj;
        spyOn(fs, 'existsSync').andReturn(true);
        spyOn(fs, 'readFileSync').andReturn('{}');
        spyOn(notifications, 'addError').andCallThrough();
        obj = autoIndent.readEslintrcOptions();
        expect(notifications.addError).not.toHaveBeenCalled();
        return expect(obj).toEqual({});
      });
      describe('::translateIndentOptions', function() {
        it('should return expected defaults when no object is input', function() {
          var expectedResult, result;
          result = autoIndent.translateIndentOptions();
          expectedResult = {
            jsxIndent: [1, 1],
            jsxIndentProps: [1, 1],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return expected defaults when no valid object is input', function() {
          var expectedResult, result;
          result = autoIndent.translateIndentOptions({});
          expectedResult = {
            jsxIndent: [1, 1],
            jsxIndentProps: [1, 1],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return two tab markers for jsx and props when an indent of 4 spaces is found', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, 4]
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: [1, 2],
            jsxIndentProps: [1, 2],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return one tab markers for jsx and props when an indent "tab" is found', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, "tab"]
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: [1, 1],
            jsxIndentProps: [1, 1],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return jsxIndent of 2 tabs and jsxIndentProps of 3', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, 6],
            "react/jsx-indent": ["warn", 4]
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: ['warn', 2],
            jsxIndentProps: [1, 3],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return jsxIndent of 2 tabs and jsxIndentProps of 2', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, 6],
            "react/jsx-indent": ["warn", 4],
            "react/jsx-indent-props": [2, 4]
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: ['warn', 2],
            jsxIndentProps: [2, 2],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        it('should return jsxIndent of 2 tabs and jsxIndentProps of 2, line-aligned', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, 6],
            "react/jsx-indent": ["warn", 4],
            "react/jsx-indent-props": [2, 4],
            'react/jsx-closing-bracket-location': [1, 'line-aligned']
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: ['warn', 2],
            jsxIndentProps: [2, 2],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'line-aligned',
                nonEmpty: 'line-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
        return it('should return jsxIndent of 2 tabs and jsxIndentProps of 2, line-aligned and props-aligned', function() {
          var expectedResult, result, rules;
          rules = {
            "indent": [1, 6],
            "react/jsx-indent": ["warn", 4],
            "react/jsx-indent-props": [2, 4],
            "react/jsx-closing-bracket-location": [
              1, {
                "nonEmpty": "props-aligned",
                "selfClosing": "line-aligned"
              }
            ]
          };
          result = autoIndent.translateIndentOptions(rules);
          expectedResult = {
            jsxIndent: ['warn', 2],
            jsxIndentProps: [2, 2],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'line-aligned',
                nonEmpty: 'props-aligned'
              }
            ]
          };
          return expect(result).toEqual(expectedResult);
        });
      });
      describe('::indentJSX', function() {
        beforeEach(function() {
          sourceCode = "<div className={rootClass}>\n{this._renderPlaceholder()}\n<div\nclassName={cx('DraftEditor/editorContainer')}\nkey={'editor' + this.state.containerKey}\nref=\"editorContainer\"\n>\n<div\naria-activedescendant={\nreadOnly ? null : this.props.ariaActiveDescendantID\n}\naria-autocomplete={readOnly ? null : this.props.ariaAutoComplete}\n>\n{this._renderPlaceholder()}\n<Component p1\np2\n/>\n</div>\n{ // tests inline JSX\ntrainerProfile.backgroundImageLink\n? <Image style={styles.video} source={{uri: `${AppConfig.apiURL}${trainerProfile.backgroundImageLink}`}} />\n: <Image style={styles.video} source={{uri: `https://placehold.it/375x140`}} />\n}\n{\ncond ?\n<span/>:\n<span></span>\n}\n</div>\n</div>\n";
          editor.insertText(sourceCode);
          sourceCodeRange = new Range(new Point(0, 0), new Point(31, 0));
          return indentJSXRange = new Range(new Point(0, 0), new Point(30, 1));
        });
        it('should indent JSX according to eslint rules', function() {
          var indentedCode;
          indentedCode = "<div className={rootClass}>\n  {this._renderPlaceholder()}\n  <div\n    className={cx('DraftEditor/editorContainer')}\n    key={'editor' + this.state.containerKey}\n    ref=\"editorContainer\"\n  >\n    <div\n      aria-activedescendant={\n        readOnly ? null : this.props.ariaActiveDescendantID\n      }\n      aria-autocomplete={readOnly ? null : this.props.ariaAutoComplete}\n    >\n      {this._renderPlaceholder()}\n      <Component p1\n        p2\n      />\n    </div>\n    { // tests inline JSX\n      trainerProfile.backgroundImageLink\n        ? <Image style={styles.video} source={{uri: `${AppConfig.apiURL}${trainerProfile.backgroundImageLink}`}} />\n        : <Image style={styles.video} source={{uri: `https://placehold.it/375x140`}} />\n    }\n    {\n      cond ?\n        <span/>:\n        <span></span>\n    }\n  </div>\n</div>\n";
          autoIndent.eslintIndentOptions = {
            jsxIndent: [1, 1],
            jsxIndentProps: [1, 1],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tag-aligned',
                nonEmpty: 'tag-aligned'
              }
            ]
          };
          autoIndent.autoJsx = true;
          autoIndent.indentJSX(indentJSXRange);
          return expect(editor.getTextInBufferRange(sourceCodeRange)).toEqual(indentedCode);
        });
        return it('should indent JSX according to eslint rules and tag closing alignment', function() {
          var indentedCode;
          indentedCode = "<div className={rootClass}>\n    {this._renderPlaceholder()}\n    <div\n        className={cx('DraftEditor/editorContainer')}\n        key={'editor' + this.state.containerKey}\n        ref=\"editorContainer\"\n        >\n        <div\n            aria-activedescendant={\n                readOnly ? null : this.props.ariaActiveDescendantID\n            }\n            aria-autocomplete={readOnly ? null : this.props.ariaAutoComplete}\n            >\n            {this._renderPlaceholder()}\n            <Component p1\n                p2\n                />\n        </div>\n        { // tests inline JSX\n            trainerProfile.backgroundImageLink\n                ? <Image style={styles.video} source={{uri: `${AppConfig.apiURL}${trainerProfile.backgroundImageLink}`}} />\n                : <Image style={styles.video} source={{uri: `https://placehold.it/375x140`}} />\n        }\n        {\n            cond ?\n                <span/>:\n                <span></span>\n        }\n    </div>\n</div>\n";
          autoIndent.eslintIndentOptions = {
            jsxIndent: [1, 2],
            jsxIndentProps: [1, 2],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'props-aligned',
                nonEmpty: 'props-aligned'
              }
            ]
          };
          autoIndent.autoJsx = true;
          autoIndent.indentJSX(indentJSXRange);
          return expect(editor.getTextInBufferRange(sourceCodeRange)).toEqual(indentedCode);
        });
      });
      return describe('insert-nl-jsx', function() {
        return it('should insert two new lines and position cursor between JSX tags', function() {
          autoIndent.eslintIndentOptions = {
            jsxIndent: [1, 1],
            jsxIndentProps: [1, 1],
            jsxClosingBracketLocation: [
              1, {
                selfClosing: 'tabs-aligned',
                nonEmpty: 'tabs-aligned'
              }
            ]
          };
          autoIndent.autoJsx = true;
          editor.insertText('<div></div>');
          editor.setCursorBufferPosition([0, 5]);
          editor.insertText('\n');
          expect(editor.getTextInBufferRange([[0, 0], [0, 5]])).toEqual("<div>");
          expect(editor.getTextInBufferRange([[1, 0], [1, 2]])).toEqual("  ");
          expect(editor.getTextInBufferRange([[2, 0], [2, 6]])).toEqual("</div>");
          return expect(editor.getCursorBufferPosition()).toEqual([1, 2]);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvc3BlYy9hdXRvLWluZGVudC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLEVBQUEsR0FBSyxPQUFBLENBQVEsU0FBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsVUFBQSxHQUFhLE9BQUEsQ0FBUSxvQkFBUjs7RUFFYixRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO0FBQ3RCLFFBQUE7SUFBQSxPQUFtRixFQUFuRixFQUFDLG9CQUFELEVBQWEsZ0JBQWIsRUFBcUIsdUJBQXJCLEVBQW9DLG9CQUFwQyxFQUFnRCx5QkFBaEQsRUFBaUU7SUFFakUsVUFBQSxDQUFXLFNBQUE7YUFDVCxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsZ0JBQTlCO01BRGMsQ0FBaEI7SUFEUyxDQUFYO0lBSUEsVUFBQSxDQUFXLFNBQUE7TUFDVCxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsaUJBQXBCLENBQXNDLENBQUMsSUFBdkMsQ0FBNEMsU0FBQyxDQUFEO2lCQUFPLE1BQUEsR0FBUztRQUFoQixDQUE1QztNQURjLENBQWhCO2FBR0EsSUFBQSxDQUFLLFNBQUE7UUFDSCxVQUFBLEdBQWlCLElBQUEsVUFBQSxDQUFXLE1BQVg7ZUFDakIsYUFBQSxHQUFnQixJQUFJLENBQUM7TUFGbEIsQ0FBTDtJQUpTLENBQVg7SUFVQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO2FBQ3hCLEVBQUEsQ0FBRywrQ0FBSCxFQUFvRCxTQUFBO0FBQ2xELFlBQUE7UUFBQSxjQUFBLEdBQ0U7VUFBQSxTQUFBLEVB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QTJCO2NBQUUsQ0FBRixFQUN6QjtnQkFBQSxXQUFBLEVBQWEsY0FBYjtnQkFDQSxRQUFBLEVBQVUsY0FEVjtlQUR5QjthQUYzQjs7VUFLRixVQUFVLENBQUMsT0FBWCxHQUFxQjtVQUNyQixNQUFNLENBQUMsVUFBUCxDQUFrQixhQUFsQjtVQUNBLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixDQUFDLENBQUQsRUFBRyxDQUFILENBQS9CO1VBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7VUFFQSxNQUFBLENBQU8sTUFBTSxDQUFDLG9CQUFQLENBQTRCLENBQUMsQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFELEVBQU8sQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUFQLENBQTVCLENBQVAsQ0FBa0QsQ0FBQyxPQUFuRCxDQUEyRCxPQUEzRDtVQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsQ0FBQyxDQUFDLENBQUQsRUFBRyxDQUFILENBQUQsRUFBTyxDQUFDLENBQUQsRUFBRyxDQUFILENBQVAsQ0FBNUIsQ0FBUCxDQUFrRCxDQUFDLE9BQW5ELENBQTJELElBQTNEO1VBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixDQUFDLENBQUMsQ0FBRCxFQUFHLENBQUgsQ0FBRCxFQUFPLENBQUMsQ0FBRCxFQUFHLENBQUgsQ0FBUCxDQUE1QixDQUFQLENBQWtELENBQUMsT0FBbkQsQ0FBMkQsUUFBM0Q7aUJBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyx1QkFBUCxDQUFBLENBQVAsQ0FBd0MsQ0FBQyxPQUF6QyxDQUFpRCxDQUFDLENBQUQsRUFBRyxDQUFILENBQWpEO1FBaEJxRSxDQUF2RTtNQUZ3QixDQUExQjtJQWxQZ0MsQ0FBbEM7RUFsQ3NCLENBQXhCO0FBTEEiLCJzb3VyY2VzQ29udGVudCI6WyIjIFRlc3RzIGZvciBBdXRvIEluZGVudGluZyBKU1hcblxue1JhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5BdXRvSW5kZW50ID0gcmVxdWlyZSAnLi4vbGliL2F1dG8taW5kZW50J1xuXG5kZXNjcmliZSAnYXV0by1pbmRlbnQnLCAtPlxuICBbYXV0b0luZGVudCwgZWRpdG9yLCBub3RpZmljYXRpb25zLCBzb3VyY2VDb2RlLCBzb3VyY2VDb2RlUmFuZ2UsIGluZGVudEpTWFJhbmdlXSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWJhYmVsJylcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdub24tZXhpc3RlbnQuanMnKS50aGVuIChvKSAtPiBlZGl0b3IgPSBvXG5cbiAgICBydW5zIC0+XG4gICAgICBhdXRvSW5kZW50ID0gbmV3IEF1dG9JbmRlbnQoZWRpdG9yKVxuICAgICAgbm90aWZpY2F0aW9ucyA9IGF0b20ubm90aWZpY2F0aW9uc1xuXG5cbiAgIyA6OiBjb25zdHJ1Y3RvclxuICBkZXNjcmliZSAnOjpjb25zdHJ1Y3RvcicsIC0+XG4gICAgaXQgJyBzaG91bGQgc2V0dXAgc29tZSB2YWxpZCBpbmRlbnRhdGlvbiBkZWZhdWx0cycsIC0+XG4gICAgICBleHBlY3RlZFJlc3VsdCA9XG4gICAgICAgIGpzeEluZGVudDogWzEsMV1cbiAgICAgICAganN4SW5kZW50UHJvcHM6IFsxLDFdXG4gICAgICAgIGpzeENsb3NpbmdCcmFja2V0TG9jYXRpb246IFsgMSwgeyBzZWxmQ2xvc2luZzogJ3RhZy1hbGlnbmVkJywgbm9uRW1wdHk6ICd0YWctYWxpZ25lZCd9IF1cbiAgICAgIGV4cGVjdChhdXRvSW5kZW50LmVzbGludEluZGVudE9wdGlvbnMpLnRvRXF1YWwoZXhwZWN0ZWRSZXN1bHQpXG5cbiAgIyA6OmdldEVzbGludHJjRmlsZW5hbWVcbiAgZGVzY3JpYmUgJzo6Z2V0RXNsaW50cmNGaWxlbmFtZScsIC0+XG4gICAgaXQgJ3JldHVybnMgYSBjb3JyZWN0IHByb2plY3QgcGF0aCBmb3IgdGhlIHNvdXJjZSBmaWxlJywgLT5cbiAgICAgIGV4cGVjdChwYXRoLmRpcm5hbWUoYXV0b0luZGVudC5nZXRFc2xpbnRyY0ZpbGVuYW1lKCkpKS50b0VxdWFsKHBhdGguZGlybmFtZShlZGl0b3IuZ2V0UGF0aCgpKSlcblxuICAgIGl0ICdyZXR1cm5zIGEgLmVzbGludHJjIGZpbGUgbmFtZScsIC0+XG4gICAgICBleHBlY3QocGF0aC5iYXNlbmFtZShhdXRvSW5kZW50LmdldEVzbGludHJjRmlsZW5hbWUoKSkpLnRvRXF1YWwoJy5lc2xpbnRyYycpXG5cbiAgIyA6OnJlYWRFc2xpbnRyY09wdGlvbnNcbiAgZGVzY3JpYmUgJzo6cmVhZEVzbGludHJjT3B0aW9ucycsIC0+XG4gICAgaXQgJ3JldHVybnMgYW4gZW1wdHkgb2JqZWN0IG9uIGEgbWlzc2luZyAuZXNsaW50cmMnLCAtPlxuICAgICAgZXhwZWN0KGF1dG9JbmRlbnQucmVhZEVzbGludHJjT3B0aW9ucygnLm1pc3NpbmcnKSkudG9FcXVhbCh7fSlcblxuICAgIGl0ICdyZXR1cm5zIGFuZCBlbXB0eSBPYmplY3QgYW5kIGEgbm90aWZpY2F0aW9uIG1lc3NhZ2Ugb24gYmFkIGVzbGludCcsIC0+XG4gICAgICBzcHlPbihmcywgJ2V4aXN0c1N5bmMnKS5hbmRSZXR1cm4odHJ1ZSlcbiAgICAgIHNweU9uKGZzLCAncmVhZEZpbGVTeW5jJykuYW5kUmV0dXJuKCd7JylcbiAgICAgIHNweU9uKG5vdGlmaWNhdGlvbnMsICdhZGRFcnJvcicpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgIG9iaiA9IGF1dG9JbmRlbnQucmVhZEVzbGludHJjT3B0aW9ucygpXG4gICAgICBleHBlY3Qobm90aWZpY2F0aW9ucy5hZGRFcnJvcikudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3Qob2JqKS50b0VxdWFsKHt9KVxuXG4gICAgaXQgJ3JldHVybnMgYW4gZW1wdHkgT2JqZWN0IHdoZW4gZXNsaW50IHdpdGggbm8gcnVsZXMgaXMgcmVhZCcsIC0+XG4gICAgICBzcHlPbihmcywgJ2V4aXN0c1N5bmMnKS5hbmRSZXR1cm4odHJ1ZSlcbiAgICAgIHNweU9uKGZzLCAncmVhZEZpbGVTeW5jJykuYW5kUmV0dXJuKCd7fScpXG4gICAgICBzcHlPbihub3RpZmljYXRpb25zLCAnYWRkRXJyb3InKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICBvYmogPSBhdXRvSW5kZW50LnJlYWRFc2xpbnRyY09wdGlvbnMoKVxuICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvbnMuYWRkRXJyb3IpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgIGV4cGVjdChvYmopLnRvRXF1YWwoe30pXG5cbiAgICAjIDo6dHJhbnNsYXRlSW5kZW50T3B0aW9uc1xuICAgIGRlc2NyaWJlICc6OnRyYW5zbGF0ZUluZGVudE9wdGlvbnMnLCAtPlxuICAgICAgaXQgJ3Nob3VsZCByZXR1cm4gZXhwZWN0ZWQgZGVmYXVsdHMgd2hlbiBubyBvYmplY3QgaXMgaW5wdXQnLCAtPlxuICAgICAgICByZXN1bHQgPSBhdXRvSW5kZW50LnRyYW5zbGF0ZUluZGVudE9wdGlvbnMoKVxuICAgICAgICBleHBlY3RlZFJlc3VsdCA9XG4gICAgICAgICAganN4SW5kZW50OiBbMSwxXVxuICAgICAgICAgIGpzeEluZGVudFByb3BzOiBbMSwxXVxuICAgICAgICAgIGpzeENsb3NpbmdCcmFja2V0TG9jYXRpb246IFsgMSwgeyBzZWxmQ2xvc2luZzogJ3RhZy1hbGlnbmVkJywgbm9uRW1wdHk6ICd0YWctYWxpZ25lZCd9IF1cbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChleHBlY3RlZFJlc3VsdClcblxuICAgICAgaXQgJ3Nob3VsZCByZXR1cm4gZXhwZWN0ZWQgZGVmYXVsdHMgd2hlbiBubyB2YWxpZCBvYmplY3QgaXMgaW5wdXQnLCAtPlxuICAgICAgICByZXN1bHQgPSBhdXRvSW5kZW50LnRyYW5zbGF0ZUluZGVudE9wdGlvbnMoe30pXG4gICAgICAgIGV4cGVjdGVkUmVzdWx0ID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsxLDFdXG4gICAgICAgICAganN4SW5kZW50UHJvcHM6IFsxLDFdXG4gICAgICAgICAganN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvbjogWyAxLCB7IHNlbGZDbG9zaW5nOiAndGFnLWFsaWduZWQnLCBub25FbXB0eTogJ3RhZy1hbGlnbmVkJ30gXVxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuXG4gICAgICBpdCAnc2hvdWxkIHJldHVybiB0d28gdGFiIG1hcmtlcnMgZm9yIGpzeCBhbmQgcHJvcHMgd2hlbiBhbiBpbmRlbnQgb2YgNCBzcGFjZXMgaXMgZm91bmQnLCAtPlxuICAgICAgICBydWxlcyA9XG4gICAgICAgICAgXCJpbmRlbnRcIjogWzEsIDRdXG4gICAgICAgIHJlc3VsdCA9IGF1dG9JbmRlbnQudHJhbnNsYXRlSW5kZW50T3B0aW9ucyhydWxlcylcbiAgICAgICAgZXhwZWN0ZWRSZXN1bHQgPVxuICAgICAgICAgIGpzeEluZGVudDogWzEsMl1cbiAgICAgICAgICBqc3hJbmRlbnRQcm9wczogWzEsMl1cbiAgICAgICAgICBqc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uOiBbIDEsIHsgc2VsZkNsb3Npbmc6ICd0YWctYWxpZ25lZCcsIG5vbkVtcHR5OiAndGFnLWFsaWduZWQnfSBdXG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoZXhwZWN0ZWRSZXN1bHQpXG5cbiAgICAgIGl0ICdzaG91bGQgcmV0dXJuIG9uZSB0YWIgbWFya2VycyBmb3IganN4IGFuZCBwcm9wcyB3aGVuIGFuIGluZGVudCBcInRhYlwiIGlzIGZvdW5kJywgLT5cbiAgICAgICAgcnVsZXMgPVxuICAgICAgICAgIFwiaW5kZW50XCI6IFsxLCBcInRhYlwiXVxuICAgICAgICByZXN1bHQgPSBhdXRvSW5kZW50LnRyYW5zbGF0ZUluZGVudE9wdGlvbnMocnVsZXMpXG4gICAgICAgIGV4cGVjdGVkUmVzdWx0ID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsxLDFdXG4gICAgICAgICAganN4SW5kZW50UHJvcHM6IFsxLDFdXG4gICAgICAgICAganN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvbjogWyAxLCB7IHNlbGZDbG9zaW5nOiAndGFnLWFsaWduZWQnLCBub25FbXB0eTogJ3RhZy1hbGlnbmVkJ30gXVxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuXG4gICAgICBpdCAnc2hvdWxkIHJldHVybiBqc3hJbmRlbnQgb2YgMiB0YWJzIGFuZCBqc3hJbmRlbnRQcm9wcyBvZiAzJywgLT5cbiAgICAgICAgcnVsZXMgPVxuICAgICAgICAgIFwiaW5kZW50XCI6IFsxLCA2XVxuICAgICAgICAgIFwicmVhY3QvanN4LWluZGVudFwiOiBbXCJ3YXJuXCIsIDRdXG4gICAgICAgIHJlc3VsdCA9IGF1dG9JbmRlbnQudHJhbnNsYXRlSW5kZW50T3B0aW9ucyhydWxlcylcbiAgICAgICAgZXhwZWN0ZWRSZXN1bHQgPVxuICAgICAgICAgIGpzeEluZGVudDogWyd3YXJuJywgMl1cbiAgICAgICAgICBqc3hJbmRlbnRQcm9wczogWzEsIDNdXG4gICAgICAgICAganN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvbjogWyAxLCB7IHNlbGZDbG9zaW5nOiAndGFnLWFsaWduZWQnLCBub25FbXB0eTogJ3RhZy1hbGlnbmVkJ30gXVxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuXG4gICAgICBpdCAnc2hvdWxkIHJldHVybiBqc3hJbmRlbnQgb2YgMiB0YWJzIGFuZCBqc3hJbmRlbnRQcm9wcyBvZiAyJywgLT5cbiAgICAgICAgcnVsZXMgPVxuICAgICAgICAgIFwiaW5kZW50XCI6IFsxLCA2XVxuICAgICAgICAgIFwicmVhY3QvanN4LWluZGVudFwiOiBbXCJ3YXJuXCIsIDRdXG4gICAgICAgICAgXCJyZWFjdC9qc3gtaW5kZW50LXByb3BzXCI6IFsyLCA0XVxuICAgICAgICByZXN1bHQgPSBhdXRvSW5kZW50LnRyYW5zbGF0ZUluZGVudE9wdGlvbnMocnVsZXMpXG4gICAgICAgIGV4cGVjdGVkUmVzdWx0ID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsnd2FybicsIDJdXG4gICAgICAgICAganN4SW5kZW50UHJvcHM6IFsyLCAyXVxuICAgICAgICAgIGpzeENsb3NpbmdCcmFja2V0TG9jYXRpb246IFsgMSwgeyBzZWxmQ2xvc2luZzogJ3RhZy1hbGlnbmVkJywgbm9uRW1wdHk6ICd0YWctYWxpZ25lZCd9IF1cbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbChleHBlY3RlZFJlc3VsdClcblxuICAgICAgaXQgJ3Nob3VsZCByZXR1cm4ganN4SW5kZW50IG9mIDIgdGFicyBhbmQganN4SW5kZW50UHJvcHMgb2YgMiwgbGluZS1hbGlnbmVkJywgLT5cbiAgICAgICAgcnVsZXMgPVxuICAgICAgICAgIFwiaW5kZW50XCI6IFsxLCA2XVxuICAgICAgICAgIFwicmVhY3QvanN4LWluZGVudFwiOiBbXCJ3YXJuXCIsIDRdXG4gICAgICAgICAgXCJyZWFjdC9qc3gtaW5kZW50LXByb3BzXCI6IFsyLCA0XVxuICAgICAgICAgICdyZWFjdC9qc3gtY2xvc2luZy1icmFja2V0LWxvY2F0aW9uJzogWzEsICdsaW5lLWFsaWduZWQnXVxuICAgICAgICByZXN1bHQgPSBhdXRvSW5kZW50LnRyYW5zbGF0ZUluZGVudE9wdGlvbnMocnVsZXMpXG4gICAgICAgIGV4cGVjdGVkUmVzdWx0ID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsnd2FybicsIDJdXG4gICAgICAgICAganN4SW5kZW50UHJvcHM6IFsyLCAyXVxuICAgICAgICAgIGpzeENsb3NpbmdCcmFja2V0TG9jYXRpb246IFsgMSwgeyBzZWxmQ2xvc2luZzogJ2xpbmUtYWxpZ25lZCcsIG5vbkVtcHR5OiAnbGluZS1hbGlnbmVkJ30gXVxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuXG4gICAgICBpdCAnc2hvdWxkIHJldHVybiBqc3hJbmRlbnQgb2YgMiB0YWJzIGFuZCBqc3hJbmRlbnRQcm9wcyBvZiAyLCBsaW5lLWFsaWduZWQgYW5kIHByb3BzLWFsaWduZWQnLCAtPlxuICAgICAgICBydWxlcyA9XG4gICAgICAgICAgXCJpbmRlbnRcIjogWzEsIDZdXG4gICAgICAgICAgXCJyZWFjdC9qc3gtaW5kZW50XCI6IFtcIndhcm5cIiwgNF1cbiAgICAgICAgICBcInJlYWN0L2pzeC1pbmRlbnQtcHJvcHNcIjogWzIsIDRdXG4gICAgICAgICAgXCJyZWFjdC9qc3gtY2xvc2luZy1icmFja2V0LWxvY2F0aW9uXCI6IFsgMSxcbiAgICAgICAgICAgIFwibm9uRW1wdHlcIjogXCJwcm9wcy1hbGlnbmVkXCIsXG4gICAgICAgICAgICBcInNlbGZDbG9zaW5nXCI6IFwibGluZS1hbGlnbmVkXCJcbiAgICAgICAgICBdXG4gICAgICAgIHJlc3VsdCA9IGF1dG9JbmRlbnQudHJhbnNsYXRlSW5kZW50T3B0aW9ucyhydWxlcylcbiAgICAgICAgZXhwZWN0ZWRSZXN1bHQgPVxuICAgICAgICAgIGpzeEluZGVudDogWyd3YXJuJywgMl1cbiAgICAgICAgICBqc3hJbmRlbnRQcm9wczogWzIsIDJdXG4gICAgICAgICAganN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvbjogWyAxLCB7IHNlbGZDbG9zaW5nOiAnbGluZS1hbGlnbmVkJywgbm9uRW1wdHk6ICdwcm9wcy1hbGlnbmVkJ30gXVxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKGV4cGVjdGVkUmVzdWx0KVxuXG4gICAgIzogaW5kZW50SlNYXG4gICAgZGVzY3JpYmUgJzo6aW5kZW50SlNYJywgLT5cblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzb3VyY2VDb2RlID0gXCJcIlwiXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3Jvb3RDbGFzc30+XG4gICAgICAgICAge3RoaXMuX3JlbmRlclBsYWNlaG9sZGVyKCl9XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzTmFtZT17Y3goJ0RyYWZ0RWRpdG9yL2VkaXRvckNvbnRhaW5lcicpfVxuICAgICAgICAgIGtleT17J2VkaXRvcicgKyB0aGlzLnN0YXRlLmNvbnRhaW5lcktleX1cbiAgICAgICAgICByZWY9XCJlZGl0b3JDb250YWluZXJcIlxuICAgICAgICAgID5cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgYXJpYS1hY3RpdmVkZXNjZW5kYW50PXtcbiAgICAgICAgICByZWFkT25seSA/IG51bGwgOiB0aGlzLnByb3BzLmFyaWFBY3RpdmVEZXNjZW5kYW50SURcbiAgICAgICAgICB9XG4gICAgICAgICAgYXJpYS1hdXRvY29tcGxldGU9e3JlYWRPbmx5ID8gbnVsbCA6IHRoaXMucHJvcHMuYXJpYUF1dG9Db21wbGV0ZX1cbiAgICAgICAgICA+XG4gICAgICAgICAge3RoaXMuX3JlbmRlclBsYWNlaG9sZGVyKCl9XG4gICAgICAgICAgPENvbXBvbmVudCBwMVxuICAgICAgICAgIHAyXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICB7IC8vIHRlc3RzIGlubGluZSBKU1hcbiAgICAgICAgICB0cmFpbmVyUHJvZmlsZS5iYWNrZ3JvdW5kSW1hZ2VMaW5rXG4gICAgICAgICAgPyA8SW1hZ2Ugc3R5bGU9e3N0eWxlcy52aWRlb30gc291cmNlPXt7dXJpOiBgJHtBcHBDb25maWcuYXBpVVJMfSR7dHJhaW5lclByb2ZpbGUuYmFja2dyb3VuZEltYWdlTGlua31gfX0gLz5cbiAgICAgICAgICA6IDxJbWFnZSBzdHlsZT17c3R5bGVzLnZpZGVvfSBzb3VyY2U9e3t1cmk6IGBodHRwczovL3BsYWNlaG9sZC5pdC8zNzV4MTQwYH19IC8+XG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICBjb25kID9cbiAgICAgICAgICA8c3Bhbi8+OlxuICAgICAgICAgIDxzcGFuPjwvc3Bhbj5cbiAgICAgICAgICB9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoc291cmNlQ29kZSlcbiAgICAgICAgc291cmNlQ29kZVJhbmdlID0gbmV3IFJhbmdlKG5ldyBQb2ludCgwLDApLCBuZXcgUG9pbnQoMzEsMCkpXG4gICAgICAgIGluZGVudEpTWFJhbmdlID0gbmV3IFJhbmdlKG5ldyBQb2ludCgwLDApLCBuZXcgUG9pbnQoMzAsMSkpXG5cbiAgICAgIGl0ICdzaG91bGQgaW5kZW50IEpTWCBhY2NvcmRpbmcgdG8gZXNsaW50IHJ1bGVzJywgLT5cbiAgICAgICAgaW5kZW50ZWRDb2RlID0gXCJcIlwiXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3Jvb3RDbGFzc30+XG4gICAgICAgICAgICB7dGhpcy5fcmVuZGVyUGxhY2Vob2xkZXIoKX1cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPXtjeCgnRHJhZnRFZGl0b3IvZWRpdG9yQ29udGFpbmVyJyl9XG4gICAgICAgICAgICAgIGtleT17J2VkaXRvcicgKyB0aGlzLnN0YXRlLmNvbnRhaW5lcktleX1cbiAgICAgICAgICAgICAgcmVmPVwiZWRpdG9yQ29udGFpbmVyXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGFyaWEtYWN0aXZlZGVzY2VuZGFudD17XG4gICAgICAgICAgICAgICAgICByZWFkT25seSA/IG51bGwgOiB0aGlzLnByb3BzLmFyaWFBY3RpdmVEZXNjZW5kYW50SURcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXJpYS1hdXRvY29tcGxldGU9e3JlYWRPbmx5ID8gbnVsbCA6IHRoaXMucHJvcHMuYXJpYUF1dG9Db21wbGV0ZX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt0aGlzLl9yZW5kZXJQbGFjZWhvbGRlcigpfVxuICAgICAgICAgICAgICAgIDxDb21wb25lbnQgcDFcbiAgICAgICAgICAgICAgICAgIHAyXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIHsgLy8gdGVzdHMgaW5saW5lIEpTWFxuICAgICAgICAgICAgICAgIHRyYWluZXJQcm9maWxlLmJhY2tncm91bmRJbWFnZUxpbmtcbiAgICAgICAgICAgICAgICAgID8gPEltYWdlIHN0eWxlPXtzdHlsZXMudmlkZW99IHNvdXJjZT17e3VyaTogYCR7QXBwQ29uZmlnLmFwaVVSTH0ke3RyYWluZXJQcm9maWxlLmJhY2tncm91bmRJbWFnZUxpbmt9YH19IC8+XG4gICAgICAgICAgICAgICAgICA6IDxJbWFnZSBzdHlsZT17c3R5bGVzLnZpZGVvfSBzb3VyY2U9e3t1cmk6IGBodHRwczovL3BsYWNlaG9sZC5pdC8zNzV4MTQwYH19IC8+XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbmQgP1xuICAgICAgICAgICAgICAgICAgPHNwYW4vPjpcbiAgICAgICAgICAgICAgICAgIDxzcGFuPjwvc3Bhbj5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgIyByZW1lbWJlciB0aGlzIGlzIHRhYnMgYmFzZWQgb24gYXRvbSBkZWZhdWx0XG4gICAgICAgIGF1dG9JbmRlbnQuZXNsaW50SW5kZW50T3B0aW9ucyA9XG4gICAgICAgICAganN4SW5kZW50OiBbMSwgMV1cbiAgICAgICAgICBqc3hJbmRlbnRQcm9wczogWzEsIDFdXG4gICAgICAgICAganN4Q2xvc2luZ0JyYWNrZXRMb2NhdGlvbjogWyAxLFxuICAgICAgICAgICBzZWxmQ2xvc2luZzogJ3RhZy1hbGlnbmVkJ1xuICAgICAgICAgICBub25FbXB0eTogJ3RhZy1hbGlnbmVkJyBdXG4gICAgICAgICBhdXRvSW5kZW50LmF1dG9Kc3ggPSB0cnVlXG4gICAgICAgICBhdXRvSW5kZW50LmluZGVudEpTWChpbmRlbnRKU1hSYW5nZSlcbiAgICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2Uoc291cmNlQ29kZVJhbmdlKSkudG9FcXVhbChpbmRlbnRlZENvZGUpXG5cbiAgICAgIGl0ICdzaG91bGQgaW5kZW50IEpTWCBhY2NvcmRpbmcgdG8gZXNsaW50IHJ1bGVzIGFuZCB0YWcgY2xvc2luZyBhbGlnbm1lbnQnLCAtPlxuICAgICAgICBpbmRlbnRlZENvZGUgPSBcIlwiXCJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17cm9vdENsYXNzfT5cbiAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclBsYWNlaG9sZGVyKCl9XG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17Y3goJ0RyYWZ0RWRpdG9yL2VkaXRvckNvbnRhaW5lcicpfVxuICAgICAgICAgICAgICAgICAga2V5PXsnZWRpdG9yJyArIHRoaXMuc3RhdGUuY29udGFpbmVyS2V5fVxuICAgICAgICAgICAgICAgICAgcmVmPVwiZWRpdG9yQ29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgICAgICBhcmlhLWFjdGl2ZWRlc2NlbmRhbnQ9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkT25seSA/IG51bGwgOiB0aGlzLnByb3BzLmFyaWFBY3RpdmVEZXNjZW5kYW50SURcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgYXJpYS1hdXRvY29tcGxldGU9e3JlYWRPbmx5ID8gbnVsbCA6IHRoaXMucHJvcHMuYXJpYUF1dG9Db21wbGV0ZX1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAge3RoaXMuX3JlbmRlclBsYWNlaG9sZGVyKCl9XG4gICAgICAgICAgICAgICAgICAgICAgPENvbXBvbmVudCBwMVxuICAgICAgICAgICAgICAgICAgICAgICAgICBwMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICB7IC8vIHRlc3RzIGlubGluZSBKU1hcbiAgICAgICAgICAgICAgICAgICAgICB0cmFpbmVyUHJvZmlsZS5iYWNrZ3JvdW5kSW1hZ2VMaW5rXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gPEltYWdlIHN0eWxlPXtzdHlsZXMudmlkZW99IHNvdXJjZT17e3VyaTogYCR7QXBwQ29uZmlnLmFwaVVSTH0ke3RyYWluZXJQcm9maWxlLmJhY2tncm91bmRJbWFnZUxpbmt9YH19IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogPEltYWdlIHN0eWxlPXtzdHlsZXMudmlkZW99IHNvdXJjZT17e3VyaTogYGh0dHBzOi8vcGxhY2Vob2xkLml0LzM3NXgxNDBgfX0gLz5cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25kID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4vPjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAjIHJlbWVtYmVyIHRoaXMgaXMgdGFicyBiYXNlZCBvbiBhdG9tIGRlZmF1bHRcbiAgICAgICAgYXV0b0luZGVudC5lc2xpbnRJbmRlbnRPcHRpb25zID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsxLCAyXVxuICAgICAgICAgIGpzeEluZGVudFByb3BzOiBbMSwgMl1cbiAgICAgICAgICBqc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uOiBbIDEsXG4gICAgICAgICAgICBzZWxmQ2xvc2luZzogJ3Byb3BzLWFsaWduZWQnXG4gICAgICAgICAgICBub25FbXB0eTogJ3Byb3BzLWFsaWduZWQnIF1cbiAgICAgICAgIGF1dG9JbmRlbnQuYXV0b0pzeCA9IHRydWVcbiAgICAgICAgIGF1dG9JbmRlbnQuaW5kZW50SlNYKGluZGVudEpTWFJhbmdlKVxuICAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShzb3VyY2VDb2RlUmFuZ2UpKS50b0VxdWFsKGluZGVudGVkQ29kZSlcblxuICAgICMgdGVzdCBpbnNlcnQgbmV3bGluZSBiZXR3ZWVuIG9wZW5pbmcgY2xvc2luZyBKU1ggdGFnc1xuICAgIGRlc2NyaWJlICdpbnNlcnQtbmwtanN4JywgLT5cblxuICAgICAgaXQgJ3Nob3VsZCBpbnNlcnQgdHdvIG5ldyBsaW5lcyBhbmQgcG9zaXRpb24gY3Vyc29yIGJldHdlZW4gSlNYIHRhZ3MnLCAtPlxuICAgICAgICAjIHJlbWVtYmVyIHRoaXMgaXMgdGFicyBiYXNlZCBvbiBhdG9tIGRlZmF1bHRcbiAgICAgICAgYXV0b0luZGVudC5lc2xpbnRJbmRlbnRPcHRpb25zID1cbiAgICAgICAgICBqc3hJbmRlbnQ6IFsxLCAxXVxuICAgICAgICAgIGpzeEluZGVudFByb3BzOiBbMSwgMV1cbiAgICAgICAgICBqc3hDbG9zaW5nQnJhY2tldExvY2F0aW9uOiBbIDEsXG4gICAgICAgICAgICBzZWxmQ2xvc2luZzogJ3RhYnMtYWxpZ25lZCdcbiAgICAgICAgICAgIG5vbkVtcHR5OiAndGFicy1hbGlnbmVkJyBdXG4gICAgICAgIGF1dG9JbmRlbnQuYXV0b0pzeCA9IHRydWVcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJzxkaXY+PC9kaXY+JylcbiAgICAgICAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKFswLDVdKVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnXFxuJylcblxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtbMCwwXSxbMCw1XV0pKS50b0VxdWFsKFwiPGRpdj5cIilcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbWzEsMF0sWzEsMl1dKSkudG9FcXVhbChcIiAgXCIpXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW1syLDBdLFsyLDZdXSkpLnRvRXF1YWwoXCI8L2Rpdj5cIilcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsKFsxLDJdKVxuIl19
