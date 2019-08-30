Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _escapeHtml = require('escape-html');

var _escapeHtml2 = _interopRequireDefault(_escapeHtml);

var MESSAGE_IDLE = 'Idle';

var SignalElement = (function (_HTMLElement) {
  _inherits(SignalElement, _HTMLElement);

  function SignalElement() {
    _classCallCheck(this, SignalElement);

    _get(Object.getPrototypeOf(SignalElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SignalElement, [{
    key: 'createdCallback',
    value: function createdCallback() {
      this.update([], []);
      this.classList.add('inline-block');
    }
  }, {
    key: 'update',
    value: function update(titles, history) {
      this.setBusy(!!titles.length);
      var tooltipMessage = [];
      if (history.length) {
        tooltipMessage.push('<strong>History:</strong>', history.map(function (item) {
          return (0, _escapeHtml2['default'])(item.title) + ' (' + item.duration + ')';
        }).join('<br>'));
      }
      if (titles.length) {
        tooltipMessage.push('<strong>Current:</strong>', titles.map(_escapeHtml2['default']).join('<br>'));
      }
      if (tooltipMessage.length) {
        this.setTooltip(tooltipMessage.join('<br>'));
      } else {
        this.setTooltip(MESSAGE_IDLE);
      }
    }
  }, {
    key: 'setBusy',
    value: function setBusy(busy) {
      var _this = this;

      if (busy) {
        this.classList.add('busy');
        this.classList.remove('idle');
        this.activatedLast = Date.now();
        clearTimeout(this.deactivateTimer);
      } else {
        // The logic below makes sure that busy signal is shown for at least 1 second
        var timeNow = Date.now();
        var timeThen = this.activatedLast || 0;
        var timeDifference = timeNow - timeThen;
        if (timeDifference < 1000) {
          this.deactivateTimer = setTimeout(function () {
            return _this.setBusy(false);
          }, timeDifference + 100);
        } else {
          this.classList.add('idle');
          this.classList.remove('busy');
        }
      }
    }
  }, {
    key: 'setTooltip',
    value: function setTooltip(title) {
      if (this.tooltip) {
        this.tooltip.dispose();
      }
      this.tooltip = atom.tooltips.add(this, {
        title: '<div style="text-align: left;">' + title + '</div>'
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.tooltip.dispose();
    }
  }]);

  return SignalElement;
})(HTMLElement);

exports.SignalElement = SignalElement;

var element = document.registerElement('busy-signal', {
  prototype: SignalElement.prototype
});

exports['default'] = element;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2VsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7MEJBRW1CLGFBQWE7Ozs7QUFHaEMsSUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFBOztJQUVkLGFBQWE7WUFBYixhQUFhOztXQUFiLGFBQWE7MEJBQWIsYUFBYTs7K0JBQWIsYUFBYTs7O2VBQWIsYUFBYTs7V0FLVCwyQkFBRztBQUNoQixVQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUNuQixVQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQTtLQUNuQzs7O1dBQ0ssZ0JBQUMsTUFBcUIsRUFBRSxPQUFtRCxFQUFFO0FBQ2pGLFVBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUM3QixVQUFNLGNBQWMsR0FBRyxFQUFFLENBQUE7QUFDekIsVUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ2xCLHNCQUFjLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBUyxJQUFJLEVBQUU7QUFDMUUsaUJBQVUsNkJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFLLElBQUksQ0FBQyxRQUFRLE9BQUc7U0FDbEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO09BQ2pCO0FBQ0QsVUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ2pCLHNCQUFjLENBQUMsSUFBSSxDQUFDLDJCQUEyQixFQUFFLE1BQU0sQ0FBQyxHQUFHLHlCQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7T0FDbEY7QUFDRCxVQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUU7QUFDekIsWUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7T0FDN0MsTUFBTTtBQUNMLFlBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUE7T0FDOUI7S0FDRjs7O1dBQ00saUJBQUMsSUFBYSxFQUFFOzs7QUFDckIsVUFBSSxJQUFJLEVBQUU7QUFDUixZQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUMxQixZQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUM3QixZQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUMvQixvQkFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtPQUNuQyxNQUFNOztBQUVMLFlBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUMxQixZQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQTtBQUN4QyxZQUFNLGNBQWMsR0FBRyxPQUFPLEdBQUcsUUFBUSxDQUFBO0FBQ3pDLFlBQUksY0FBYyxHQUFHLElBQUksRUFBRTtBQUN6QixjQUFJLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQzttQkFBTSxNQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUM7V0FBQSxFQUFFLGNBQWMsR0FBRyxHQUFHLENBQUMsQ0FBQTtTQUNuRixNQUFNO0FBQ0wsY0FBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDMUIsY0FBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDOUI7T0FDRjtLQUNGOzs7V0FDUyxvQkFBQyxLQUFhLEVBQUU7QUFDeEIsVUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2hCLFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDdkI7QUFDRCxVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRTtBQUNyQyxhQUFLLHNDQUFvQyxLQUFLLFdBQVE7T0FDdkQsQ0FBQyxDQUFBO0tBQ0g7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUN2Qjs7O1NBdkRVLGFBQWE7R0FBUyxXQUFXOzs7O0FBMEQ5QyxJQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRTtBQUN0RCxXQUFTLEVBQUUsYUFBYSxDQUFDLFNBQVM7Q0FDbkMsQ0FBQyxDQUFBOztxQkFFYSxPQUFPIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2VsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgZXNjYXBlIGZyb20gJ2VzY2FwZS1odG1sJ1xuaW1wb3J0IHR5cGUgeyBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcblxuY29uc3QgTUVTU0FHRV9JRExFID0gJ0lkbGUnXG5cbmV4cG9ydCBjbGFzcyBTaWduYWxFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICB0b29sdGlwOiBEaXNwb3NhYmxlO1xuICBhY3RpdmF0ZWRMYXN0OiA/bnVtYmVyO1xuICBkZWFjdGl2YXRlVGltZXI6ID9udW1iZXI7XG5cbiAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgIHRoaXMudXBkYXRlKFtdLCBbXSlcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ2lubGluZS1ibG9jaycpXG4gIH1cbiAgdXBkYXRlKHRpdGxlczogQXJyYXk8c3RyaW5nPiwgaGlzdG9yeTogQXJyYXk8eyB0aXRsZTogc3RyaW5nLCBkdXJhdGlvbjogc3RyaW5nIH0+KSB7XG4gICAgdGhpcy5zZXRCdXN5KCEhdGl0bGVzLmxlbmd0aClcbiAgICBjb25zdCB0b29sdGlwTWVzc2FnZSA9IFtdXG4gICAgaWYgKGhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICB0b29sdGlwTWVzc2FnZS5wdXNoKCc8c3Ryb25nPkhpc3Rvcnk6PC9zdHJvbmc+JywgaGlzdG9yeS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICByZXR1cm4gYCR7ZXNjYXBlKGl0ZW0udGl0bGUpfSAoJHtpdGVtLmR1cmF0aW9ufSlgXG4gICAgICB9KS5qb2luKCc8YnI+JykpXG4gICAgfVxuICAgIGlmICh0aXRsZXMubGVuZ3RoKSB7XG4gICAgICB0b29sdGlwTWVzc2FnZS5wdXNoKCc8c3Ryb25nPkN1cnJlbnQ6PC9zdHJvbmc+JywgdGl0bGVzLm1hcChlc2NhcGUpLmpvaW4oJzxicj4nKSlcbiAgICB9XG4gICAgaWYgKHRvb2x0aXBNZXNzYWdlLmxlbmd0aCkge1xuICAgICAgdGhpcy5zZXRUb29sdGlwKHRvb2x0aXBNZXNzYWdlLmpvaW4oJzxicj4nKSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRUb29sdGlwKE1FU1NBR0VfSURMRSlcbiAgICB9XG4gIH1cbiAgc2V0QnVzeShidXN5OiBib29sZWFuKSB7XG4gICAgaWYgKGJ1c3kpIHtcbiAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnYnVzeScpXG4gICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2lkbGUnKVxuICAgICAgdGhpcy5hY3RpdmF0ZWRMYXN0ID0gRGF0ZS5ub3coKVxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVhY3RpdmF0ZVRpbWVyKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGUgbG9naWMgYmVsb3cgbWFrZXMgc3VyZSB0aGF0IGJ1c3kgc2lnbmFsIGlzIHNob3duIGZvciBhdCBsZWFzdCAxIHNlY29uZFxuICAgICAgY29uc3QgdGltZU5vdyA9IERhdGUubm93KClcbiAgICAgIGNvbnN0IHRpbWVUaGVuID0gdGhpcy5hY3RpdmF0ZWRMYXN0IHx8IDBcbiAgICAgIGNvbnN0IHRpbWVEaWZmZXJlbmNlID0gdGltZU5vdyAtIHRpbWVUaGVuXG4gICAgICBpZiAodGltZURpZmZlcmVuY2UgPCAxMDAwKSB7XG4gICAgICAgIHRoaXMuZGVhY3RpdmF0ZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnNldEJ1c3koZmFsc2UpLCB0aW1lRGlmZmVyZW5jZSArIDEwMClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgnaWRsZScpXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnYnVzeScpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNldFRvb2x0aXAodGl0bGU6IHN0cmluZykge1xuICAgIGlmICh0aGlzLnRvb2x0aXApIHtcbiAgICAgIHRoaXMudG9vbHRpcC5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQodGhpcywge1xuICAgICAgdGl0bGU6IGA8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjogbGVmdDtcIj4ke3RpdGxlfTwvZGl2PmAsXG4gICAgfSlcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMudG9vbHRpcC5kaXNwb3NlKClcbiAgfVxufVxuXG5jb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdidXN5LXNpZ25hbCcsIHtcbiAgcHJvdG90eXBlOiBTaWduYWxFbGVtZW50LnByb3RvdHlwZSxcbn0pXG5cbmV4cG9ydCBkZWZhdWx0IGVsZW1lbnRcbiJdfQ==