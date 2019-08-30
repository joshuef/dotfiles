Object.defineProperty(exports, "__esModule", {
  value: true
});

// eslint-disable-next-line import/no-unresolved

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, "next"); var callThrow = step.bind(null, "throw"); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomIdeProvider = (function () {
  function AtomIdeProvider(createProvider) {
    _classCallCheck(this, AtomIdeProvider);

    this.messages = new Set();

    this.createProvider = createProvider;
  }

  _createClass(AtomIdeProvider, [{
    key: "reportBusyWhile",
    value: _asyncToGenerator(function* (title, f, options) {
      var busyMessage = this.reportBusy(title, options);
      try {
        return yield f();
      } finally {
        busyMessage.dispose();
      }
    })
  }, {
    key: "reportBusy",
    value: function reportBusy(title, options) {
      var _this = this;

      var provider = this.createProvider();

      if (options) {
        // TODO: options not implemented yet
      }

      provider.add(title);

      var busyMessage = {
        setTitle: function setTitle(newTitle) {
          provider.changeTitle(newTitle, title);
          // Cache the current title for consecutive title changes
          title = newTitle;
        },
        dispose: function dispose() {
          provider.dispose();
          _this.messages["delete"](busyMessage);
        }
      };
      this.messages.add(busyMessage);

      return busyMessage;
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.messages.forEach(function (msg) {
        msg.dispose();
      });
      this.messages.clear();
    }
  }]);

  return AtomIdeProvider;
})();

exports.AtomIdeProvider = AtomIdeProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2F0b20taWRlLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQU1hLGVBQWU7QUFJZixXQUpBLGVBQWUsQ0FJZCxjQUE4QixFQUFFOzBCQUpqQyxlQUFlOztTQUUxQixRQUFRLEdBQXFCLElBQUksR0FBRyxFQUFFOztBQUdwQyxRQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztHQUN0Qzs7ZUFOVSxlQUFlOzs2QkFRRixXQUN0QixLQUFhLEVBQ2IsQ0FBbUIsRUFDbkIsT0FBMkIsRUFDZjtBQUNaLFVBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFVBQUk7QUFDRixlQUFPLE1BQU0sQ0FBQyxFQUFFLENBQUM7T0FDbEIsU0FBUztBQUNSLG1CQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDdkI7S0FDRjs7O1dBRVMsb0JBQUMsS0FBYSxFQUFFLE9BQTJCLEVBQWU7OztBQUNsRSxVQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRXZDLFVBQUksT0FBTyxFQUFFOztPQUVaOztBQUVELGNBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXBCLFVBQU0sV0FBVyxHQUFHO0FBQ2xCLGdCQUFRLEVBQUUsa0JBQUMsUUFBUSxFQUFhO0FBQzlCLGtCQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzs7QUFFdEMsZUFBSyxHQUFHLFFBQVEsQ0FBQTtTQUNqQjtBQUNELGVBQU8sRUFBRSxtQkFBTTtBQUNiLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbkIsZ0JBQUssUUFBUSxVQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbkM7T0FDRixDQUFDO0FBQ0YsVUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7O0FBRS9CLGFBQU8sV0FBVyxDQUFDO0tBQ3BCOzs7V0FFTSxtQkFBUztBQUNkLFVBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQzNCLFdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNmLENBQUMsQ0FBQztBQUNILFVBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDdkI7OztTQW5EVSxlQUFlIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2F0b20taWRlLXByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby11bnJlc29sdmVkXG5pbXBvcnQgdHlwZSB7IEJ1c3lTaWduYWxPcHRpb25zLCBCdXN5TWVzc2FnZSB9IGZyb20gXCJhdG9tLWlkZS9idXN5LXNpZ25hbFwiO1xuaW1wb3J0IHR5cGUgUHJvdmlkZXIgZnJvbSBcIi4vcHJvdmlkZXJcIjtcblxuZXhwb3J0IGNsYXNzIEF0b21JZGVQcm92aWRlciB7XG4gIGNyZWF0ZVByb3ZpZGVyOiAoKSA9PiBQcm92aWRlcjtcbiAgbWVzc2FnZXM6IFNldDxCdXN5TWVzc2FnZT4gPSBuZXcgU2V0KCk7XG5cbiAgY29uc3RydWN0b3IoY3JlYXRlUHJvdmlkZXI6ICgpID0+IFByb3ZpZGVyKSB7XG4gICAgdGhpcy5jcmVhdGVQcm92aWRlciA9IGNyZWF0ZVByb3ZpZGVyO1xuICB9XG5cbiAgYXN5bmMgcmVwb3J0QnVzeVdoaWxlPFQ+KFxuICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgZjogKCkgPT4gUHJvbWlzZTxUPixcbiAgICBvcHRpb25zPzogQnVzeVNpZ25hbE9wdGlvbnNcbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgYnVzeU1lc3NhZ2UgPSB0aGlzLnJlcG9ydEJ1c3kodGl0bGUsIG9wdGlvbnMpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBidXN5TWVzc2FnZS5kaXNwb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgcmVwb3J0QnVzeSh0aXRsZTogc3RyaW5nLCBvcHRpb25zPzogQnVzeVNpZ25hbE9wdGlvbnMpOiBCdXN5TWVzc2FnZSB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLmNyZWF0ZVByb3ZpZGVyKCk7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgLy8gVE9ETzogb3B0aW9ucyBub3QgaW1wbGVtZW50ZWQgeWV0XG4gICAgfVxuXG4gICAgcHJvdmlkZXIuYWRkKHRpdGxlKTtcblxuICAgIGNvbnN0IGJ1c3lNZXNzYWdlID0ge1xuICAgICAgc2V0VGl0bGU6IChuZXdUaXRsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHByb3ZpZGVyLmNoYW5nZVRpdGxlKG5ld1RpdGxlLCB0aXRsZSk7XG4gICAgICAgIC8vIENhY2hlIHRoZSBjdXJyZW50IHRpdGxlIGZvciBjb25zZWN1dGl2ZSB0aXRsZSBjaGFuZ2VzXG4gICAgICAgIHRpdGxlID0gbmV3VGl0bGVcbiAgICAgIH0sXG4gICAgICBkaXNwb3NlOiAoKSA9PiB7XG4gICAgICAgIHByb3ZpZGVyLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcy5kZWxldGUoYnVzeU1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5tZXNzYWdlcy5hZGQoYnVzeU1lc3NhZ2UpO1xuXG4gICAgcmV0dXJuIGJ1c3lNZXNzYWdlO1xuICB9XG5cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLm1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcbiAgICAgIG1zZy5kaXNwb3NlKCk7XG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlcy5jbGVhcigpO1xuICB9XG59XG4iXX0=