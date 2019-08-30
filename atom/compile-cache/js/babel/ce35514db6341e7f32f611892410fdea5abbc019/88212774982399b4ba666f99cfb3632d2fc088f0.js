var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _helpers = require('./helpers');

var Intentions = (function () {
  function Intentions() {
    _classCallCheck(this, Intentions);

    this.messages = [];
    this.grammarScopes = ['*'];
  }

  _createClass(Intentions, [{
    key: 'getIntentions',
    value: function getIntentions(_ref) {
      var textEditor = _ref.textEditor;
      var bufferPosition = _ref.bufferPosition;

      var intentions = [];
      var messages = (0, _helpers.filterMessages)(this.messages, textEditor.getPath());

      var _loop = function (message) {
        var hasFixes = message.version === 1 ? message.fix : message.solutions && message.solutions.length;
        if (!hasFixes) {
          return 'continue';
        }
        var range = (0, _helpers.$range)(message);
        var inRange = range && range.containsPoint(bufferPosition);
        if (!inRange) {
          return 'continue';
        }

        var solutions = [];
        if (message.version === 1 && message.fix) {
          solutions.push(message.fix);
        } else if (message.version === 2 && message.solutions && message.solutions.length) {
          solutions = message.solutions;
        }
        var linterName = message.linterName || 'Linter';

        intentions = intentions.concat(solutions.map(function (solution) {
          return {
            priority: solution.priority ? solution.priority + 200 : 200,
            icon: 'tools',
            title: solution.title || 'Fix ' + linterName + ' issue',
            selected: function selected() {
              (0, _helpers.applySolution)(textEditor, message.version, solution);
            }
          };
        }));
      };

      for (var message of messages) {
        var _ret = _loop(message);

        if (_ret === 'continue') continue;
      }
      return intentions;
    }
  }, {
    key: 'update',
    value: function update(messages) {
      this.messages = messages;
    }
  }]);

  return Intentions;
})();

module.exports = Intentions;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2ludGVudGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozt1QkFFc0QsV0FBVzs7SUFHM0QsVUFBVTtBQUlILFdBSlAsVUFBVSxHQUlBOzBCQUpWLFVBQVU7O0FBS1osUUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbEIsUUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0dBQzNCOztlQVBHLFVBQVU7O1dBUUQsdUJBQUMsSUFBc0MsRUFBaUI7VUFBckQsVUFBVSxHQUFaLElBQXNDLENBQXBDLFVBQVU7VUFBRSxjQUFjLEdBQTVCLElBQXNDLENBQXhCLGNBQWM7O0FBQ3hDLFVBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQTtBQUNuQixVQUFNLFFBQVEsR0FBRyw2QkFBZSxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBOzs0QkFFekQsT0FBTztBQUNoQixZQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUE7QUFDcEcsWUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNiLDRCQUFRO1NBQ1Q7QUFDRCxZQUFNLEtBQUssR0FBRyxxQkFBTyxPQUFPLENBQUMsQ0FBQTtBQUM3QixZQUFNLE9BQU8sR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQUM1RCxZQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1osNEJBQVE7U0FDVDs7QUFFRCxZQUFJLFNBQXdCLEdBQUcsRUFBRSxDQUFBO0FBQ2pDLFlBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUN4QyxtQkFBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDNUIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7QUFDakYsbUJBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFBO1NBQzlCO0FBQ0QsWUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSxRQUFRLENBQUE7O0FBRWpELGtCQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FDNUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFBLFFBQVE7aUJBQUs7QUFDekIsb0JBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLEdBQUc7QUFDM0QsZ0JBQUksRUFBRSxPQUFPO0FBQ2IsaUJBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxhQUFXLFVBQVUsV0FBUTtBQUNsRCxvQkFBUSxFQUFBLG9CQUFHO0FBQ1QsMENBQWMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUE7YUFDckQ7V0FDRjtTQUFDLENBQUMsQ0FDSixDQUFBOzs7QUE1QkgsV0FBSyxJQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUU7eUJBQXJCLE9BQU87O2lDQVFkLFNBQVE7T0FxQlg7QUFDRCxhQUFPLFVBQVUsQ0FBQTtLQUNsQjs7O1dBQ0ssZ0JBQUMsUUFBOEIsRUFBRTtBQUNyQyxVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtLQUN6Qjs7O1NBOUNHLFVBQVU7OztBQWlEaEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvaW50ZW50aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7ICRyYW5nZSwgYXBwbHlTb2x1dGlvbiwgZmlsdGVyTWVzc2FnZXMgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UgfSBmcm9tICcuL3R5cGVzJ1xuXG5jbGFzcyBJbnRlbnRpb25zIHtcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+XG4gIGdyYW1tYXJTY29wZXM6IEFycmF5PHN0cmluZz5cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB0aGlzLmdyYW1tYXJTY29wZXMgPSBbJyonXVxuICB9XG4gIGdldEludGVudGlvbnMoeyB0ZXh0RWRpdG9yLCBidWZmZXJQb3NpdGlvbiB9OiBPYmplY3QpOiBBcnJheTxPYmplY3Q+IHtcbiAgICBsZXQgaW50ZW50aW9ucyA9IFtdXG4gICAgY29uc3QgbWVzc2FnZXMgPSBmaWx0ZXJNZXNzYWdlcyh0aGlzLm1lc3NhZ2VzLCB0ZXh0RWRpdG9yLmdldFBhdGgoKSlcblxuICAgIGZvciAoY29uc3QgbWVzc2FnZSBvZiBtZXNzYWdlcykge1xuICAgICAgY29uc3QgaGFzRml4ZXMgPSBtZXNzYWdlLnZlcnNpb24gPT09IDEgPyBtZXNzYWdlLmZpeCA6IG1lc3NhZ2Uuc29sdXRpb25zICYmIG1lc3NhZ2Uuc29sdXRpb25zLmxlbmd0aFxuICAgICAgaWYgKCFoYXNGaXhlcykge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuICAgICAgY29uc3QgcmFuZ2UgPSAkcmFuZ2UobWVzc2FnZSlcbiAgICAgIGNvbnN0IGluUmFuZ2UgPSByYW5nZSAmJiByYW5nZS5jb250YWluc1BvaW50KGJ1ZmZlclBvc2l0aW9uKVxuICAgICAgaWYgKCFpblJhbmdlKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGxldCBzb2x1dGlvbnM6IEFycmF5PE9iamVjdD4gPSBbXVxuICAgICAgaWYgKG1lc3NhZ2UudmVyc2lvbiA9PT0gMSAmJiBtZXNzYWdlLmZpeCkge1xuICAgICAgICBzb2x1dGlvbnMucHVzaChtZXNzYWdlLmZpeClcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS52ZXJzaW9uID09PSAyICYmIG1lc3NhZ2Uuc29sdXRpb25zICYmIG1lc3NhZ2Uuc29sdXRpb25zLmxlbmd0aCkge1xuICAgICAgICBzb2x1dGlvbnMgPSBtZXNzYWdlLnNvbHV0aW9uc1xuICAgICAgfVxuICAgICAgY29uc3QgbGludGVyTmFtZSA9IG1lc3NhZ2UubGludGVyTmFtZSB8fCAnTGludGVyJ1xuXG4gICAgICBpbnRlbnRpb25zID0gaW50ZW50aW9ucy5jb25jYXQoXG4gICAgICAgIHNvbHV0aW9ucy5tYXAoc29sdXRpb24gPT4gKHtcbiAgICAgICAgICBwcmlvcml0eTogc29sdXRpb24ucHJpb3JpdHkgPyBzb2x1dGlvbi5wcmlvcml0eSArIDIwMCA6IDIwMCxcbiAgICAgICAgICBpY29uOiAndG9vbHMnLFxuICAgICAgICAgIHRpdGxlOiBzb2x1dGlvbi50aXRsZSB8fCBgRml4ICR7bGludGVyTmFtZX0gaXNzdWVgLFxuICAgICAgICAgIHNlbGVjdGVkKCkge1xuICAgICAgICAgICAgYXBwbHlTb2x1dGlvbih0ZXh0RWRpdG9yLCBtZXNzYWdlLnZlcnNpb24sIHNvbHV0aW9uKVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pKSxcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGludGVudGlvbnNcbiAgfVxuICB1cGRhdGUobWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+KSB7XG4gICAgdGhpcy5tZXNzYWdlcyA9IG1lc3NhZ2VzXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlbnRpb25zXG4iXX0=