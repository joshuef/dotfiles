Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MESSAGE_IDLE = "Idle";

function elementWithText(text) {
  var tag = arguments.length <= 1 || arguments[1] === undefined ? "div" : arguments[1];

  var el = document.createElement(tag);
  el.textContent = text;
  return el;
}

var SignalElement = (function (_HTMLElement) {
  _inherits(SignalElement, _HTMLElement);

  function SignalElement() {
    _classCallCheck(this, SignalElement);

    _get(Object.getPrototypeOf(SignalElement.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(SignalElement, [{
    key: "createdCallback",
    value: function createdCallback() {
      this.update([], []);
      this.classList.add("inline-block");
    }
  }, {
    key: "update",
    value: function update(titles, history) {
      this.setBusy(!!titles.length);

      var el = document.createElement("div");
      el.style.textAlign = "left";

      if (history.length) {
        el.append.apply(el, [elementWithText("History:", "strong")].concat(_toConsumableArray(history.map(function (item) {
          return elementWithText(item.title + " (" + item.duration + ")");
        }))));
      }
      if (titles.length) {
        el.append.apply(el, [elementWithText("Current:", "strong")].concat(_toConsumableArray(titles.map(function (item) {
          var e = elementWithText(item.title);
          if (item.options) {
            e.onclick = item.options.onDidClick;
          }
          return e;
        }))));
      }

      if (!el.childElementCount) {
        el.textContent = MESSAGE_IDLE;
      }

      this.setTooltip(el);
    }
  }, {
    key: "setBusy",
    value: function setBusy(busy) {
      var _this = this;

      if (busy) {
        this.classList.add("busy");
        this.classList.remove("idle");
        this.activatedLast = Date.now();
        if (this.deactivateTimer) {
          clearTimeout(this.deactivateTimer);
        }
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
          this.classList.add("idle");
          this.classList.remove("busy");
        }
      }
    }
  }, {
    key: "setTooltip",
    value: function setTooltip(item) {
      if (this.tooltip) {
        this.tooltip.dispose();
      }
      this.tooltip = atom.tooltips.add(this, { item: item });
    }
  }, {
    key: "dispose",
    value: function dispose() {
      if (this.tooltip) {
        this.tooltip.dispose();
      }
    }
  }]);

  return SignalElement;
})(HTMLElement);

exports.SignalElement = SignalElement;

var element = document.registerElement("busy-signal", {
  prototype: SignalElement.prototype
});

exports["default"] = element;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2VsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFJQSxJQUFNLFlBQVksR0FBRyxNQUFNLENBQUM7O0FBRTVCLFNBQVMsZUFBZSxDQUFDLElBQUksRUFBZTtNQUFiLEdBQUcseURBQUcsS0FBSzs7QUFDeEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QyxJQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN0QixTQUFPLEVBQUUsQ0FBQztDQUNYOztJQUVZLGFBQWE7WUFBYixhQUFhOztXQUFiLGFBQWE7MEJBQWIsYUFBYTs7K0JBQWIsYUFBYTs7O2VBQWIsYUFBYTs7V0FLVCwyQkFBRztBQUNoQixVQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNwQixVQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUNwQzs7O1dBQ0ssZ0JBQ0osTUFBNkIsRUFDN0IsT0FBbUQsRUFDbkQ7QUFDQSxVQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFVBQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekMsUUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDOztBQUU1QixVQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDbEIsVUFBRSxDQUFDLE1BQU0sTUFBQSxDQUFULEVBQUUsR0FDQSxlQUFlLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyw0QkFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUk7aUJBQ2pCLGVBQWUsQ0FBSSxJQUFJLENBQUMsS0FBSyxVQUFLLElBQUksQ0FBQyxRQUFRLE9BQUk7U0FBQSxDQUNwRCxHQUNGLENBQUM7T0FDSDtBQUNELFVBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNqQixVQUFFLENBQUMsTUFBTSxNQUFBLENBQVQsRUFBRSxHQUNBLGVBQWUsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLDRCQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3BCLGNBQU0sQ0FBQyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsY0FBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2hCLGFBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7V0FDckM7QUFDRCxpQkFBTyxDQUFDLENBQUM7U0FDVixDQUFDLEdBQ0gsQ0FBQztPQUNIOztBQUVELFVBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUU7QUFDekIsVUFBRSxDQUFDLFdBQVcsR0FBRyxZQUFZLENBQUM7T0FDL0I7O0FBRUQsVUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNyQjs7O1dBQ00saUJBQUMsSUFBYSxFQUFFOzs7QUFDckIsVUFBSSxJQUFJLEVBQUU7QUFDUixZQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixZQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNoQyxZQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7QUFDeEIsc0JBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDcEM7T0FDRixNQUFNOztBQUVMLFlBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMzQixZQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQztBQUN6QyxZQUFNLGNBQWMsR0FBRyxPQUFPLEdBQUcsUUFBUSxDQUFDO0FBQzFDLFlBQUksY0FBYyxHQUFHLElBQUksRUFBRTtBQUN6QixjQUFJLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FDL0I7bUJBQU0sTUFBSyxPQUFPLENBQUMsS0FBSyxDQUFDO1dBQUEsRUFDekIsY0FBYyxHQUFHLEdBQUcsQ0FDckIsQ0FBQztTQUNILE1BQU07QUFDTCxjQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixjQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjtPQUNGO0tBQ0Y7OztXQUNTLG9CQUFDLElBQWlCLEVBQUU7QUFDNUIsVUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2hCLFlBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDeEI7QUFDRCxVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2xEOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNoQixZQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQ3hCO0tBQ0Y7OztTQS9FVSxhQUFhO0dBQVMsV0FBVzs7OztBQWtGOUMsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUU7QUFDdEQsV0FBUyxFQUFFLGFBQWEsQ0FBQyxTQUFTO0NBQ25DLENBQUMsQ0FBQzs7cUJBRVksT0FBTyIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2J1c3ktc2lnbmFsL2xpYi9lbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHR5cGUgeyBTaWduYWxJbnRlcm5hbCB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IE1FU1NBR0VfSURMRSA9IFwiSWRsZVwiO1xuXG5mdW5jdGlvbiBlbGVtZW50V2l0aFRleHQodGV4dCwgdGFnID0gXCJkaXZcIikge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICByZXR1cm4gZWw7XG59XG5cbmV4cG9ydCBjbGFzcyBTaWduYWxFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICB0b29sdGlwOiA/SURpc3Bvc2FibGU7XG4gIGFjdGl2YXRlZExhc3Q6ID9udW1iZXI7XG4gIGRlYWN0aXZhdGVUaW1lcjogP1RpbWVvdXRJRDtcblxuICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy51cGRhdGUoW10sIFtdKTtcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gIH1cbiAgdXBkYXRlKFxuICAgIHRpdGxlczogQXJyYXk8U2lnbmFsSW50ZXJuYWw+LFxuICAgIGhpc3Rvcnk6IEFycmF5PHsgdGl0bGU6IHN0cmluZywgZHVyYXRpb246IHN0cmluZyB9PlxuICApIHtcbiAgICB0aGlzLnNldEJ1c3koISF0aXRsZXMubGVuZ3RoKTtcblxuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBlbC5zdHlsZS50ZXh0QWxpZ24gPSBcImxlZnRcIjtcblxuICAgIGlmIChoaXN0b3J5Lmxlbmd0aCkge1xuICAgICAgZWwuYXBwZW5kKFxuICAgICAgICBlbGVtZW50V2l0aFRleHQoXCJIaXN0b3J5OlwiLCBcInN0cm9uZ1wiKSxcbiAgICAgICAgLi4uaGlzdG9yeS5tYXAoaXRlbSA9PlxuICAgICAgICAgIGVsZW1lbnRXaXRoVGV4dChgJHtpdGVtLnRpdGxlfSAoJHtpdGVtLmR1cmF0aW9ufSlgKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGl0bGVzLmxlbmd0aCkge1xuICAgICAgZWwuYXBwZW5kKFxuICAgICAgICBlbGVtZW50V2l0aFRleHQoXCJDdXJyZW50OlwiLCBcInN0cm9uZ1wiKSxcbiAgICAgICAgLi4udGl0bGVzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICBjb25zdCBlID0gZWxlbWVudFdpdGhUZXh0KGl0ZW0udGl0bGUpO1xuICAgICAgICAgIGlmIChpdGVtLm9wdGlvbnMpIHtcbiAgICAgICAgICAgIGUub25jbGljayA9IGl0ZW0ub3B0aW9ucy5vbkRpZENsaWNrO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFlbC5jaGlsZEVsZW1lbnRDb3VudCkge1xuICAgICAgZWwudGV4dENvbnRlbnQgPSBNRVNTQUdFX0lETEU7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRUb29sdGlwKGVsKTtcbiAgfVxuICBzZXRCdXN5KGJ1c3k6IGJvb2xlYW4pIHtcbiAgICBpZiAoYnVzeSkge1xuICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiYnVzeVwiKTtcbiAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcImlkbGVcIik7XG4gICAgICB0aGlzLmFjdGl2YXRlZExhc3QgPSBEYXRlLm5vdygpO1xuICAgICAgaWYgKHRoaXMuZGVhY3RpdmF0ZVRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmRlYWN0aXZhdGVUaW1lcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSBsb2dpYyBiZWxvdyBtYWtlcyBzdXJlIHRoYXQgYnVzeSBzaWduYWwgaXMgc2hvd24gZm9yIGF0IGxlYXN0IDEgc2Vjb25kXG4gICAgICBjb25zdCB0aW1lTm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IHRpbWVUaGVuID0gdGhpcy5hY3RpdmF0ZWRMYXN0IHx8IDA7XG4gICAgICBjb25zdCB0aW1lRGlmZmVyZW5jZSA9IHRpbWVOb3cgLSB0aW1lVGhlbjtcbiAgICAgIGlmICh0aW1lRGlmZmVyZW5jZSA8IDEwMDApIHtcbiAgICAgICAgdGhpcy5kZWFjdGl2YXRlVGltZXIgPSBzZXRUaW1lb3V0KFxuICAgICAgICAgICgpID0+IHRoaXMuc2V0QnVzeShmYWxzZSksXG4gICAgICAgICAgdGltZURpZmZlcmVuY2UgKyAxMDBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlkbGVcIik7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZShcImJ1c3lcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHNldFRvb2x0aXAoaXRlbTogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy50b29sdGlwKSB7XG4gICAgICB0aGlzLnRvb2x0aXAuZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCh0aGlzLCB7IGl0ZW0gfSk7XG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICBpZiAodGhpcy50b29sdGlwKSB7XG4gICAgICB0aGlzLnRvb2x0aXAuZGlzcG9zZSgpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBlbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwiYnVzeS1zaWduYWxcIiwge1xuICBwcm90b3R5cGU6IFNpZ25hbEVsZW1lbnQucHJvdG90eXBlXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZWxlbWVudDtcbiJdfQ==