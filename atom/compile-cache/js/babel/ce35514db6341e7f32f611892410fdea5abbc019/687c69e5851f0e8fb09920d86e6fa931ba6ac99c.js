function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// eslint-disable-line import/no-unresolved

var _main = require("./main");

var _main2 = _interopRequireDefault(_main);

module.exports = {
  activate: function activate() {
    this.instance = new _main2["default"]();
  },
  consumeStatusBar: function consumeStatusBar(statusBar) {
    this.instance.attach(statusBar);
  },
  providerRegistry: function providerRegistry() {
    return this.instance.registry;
  },
  provideBusySignal: function provideBusySignal() {
    var provider = this.instance.atomIdeProvider;
    return {
      reportBusyWhile: function reportBusyWhile(title, f, options) {
        return provider.reportBusyWhile(title, f, options);
      },

      reportBusy: function reportBusy(title, options) {
        return provider.reportBusy(title, options);
      },

      dispose: function dispose() {
        // nop
      }
    };
  },
  deactivate: function deactivate() {
    this.instance.dispose();
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7b0JBTXVCLFFBQVE7Ozs7QUFHL0IsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLFVBQVEsRUFBQSxvQkFBRztBQUNULFFBQUksQ0FBQyxRQUFRLEdBQUcsdUJBQWdCLENBQUM7R0FDbEM7QUFDRCxrQkFBZ0IsRUFBQSwwQkFBQyxTQUFpQixFQUFFO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0dBQ2pDO0FBQ0Qsa0JBQWdCLEVBQUEsNEJBQW1CO0FBQ2pDLFdBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7R0FDL0I7QUFDRCxtQkFBaUIsRUFBQSw2QkFBc0I7QUFDckMsUUFBTSxRQUEyQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO0FBQ2xFLFdBQU87QUFDTCxxQkFBZSxFQUFHLHlCQUNoQixLQUFhLEVBQ2IsQ0FBbUIsRUFDbkIsT0FBMkIsRUFDM0I7QUFDQSxlQUFPLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNwRDs7QUFFRCxnQkFBVSxFQUFBLG9CQUFDLEtBQWEsRUFBRSxPQUEyQixFQUFFO0FBQ3JELGVBQU8sUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDNUM7O0FBRUQsYUFBTyxFQUFBLG1CQUFHOztPQUVUO0tBQ0YsQ0FBQztHQUNIO0FBQ0QsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsUUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUN6QjtDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9idXN5LXNpZ25hbC9saWIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEJ1c3lTaWduYWxTZXJ2aWNlLFxuICBCdXN5U2lnbmFsT3B0aW9uc1xufSBmcm9tIFwiYXRvbS1pZGUvYnVzeS1zaWduYWxcIjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpbXBvcnQvbm8tdW5yZXNvbHZlZFxuaW1wb3J0IEJ1c3lTaWduYWwgZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHR5cGUgU2lnbmFsUmVnaXN0cnkgZnJvbSBcIi4vcmVnaXN0cnlcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjdGl2YXRlKCkge1xuICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgQnVzeVNpZ25hbCgpO1xuICB9LFxuICBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0JhcjogT2JqZWN0KSB7XG4gICAgdGhpcy5pbnN0YW5jZS5hdHRhY2goc3RhdHVzQmFyKTtcbiAgfSxcbiAgcHJvdmlkZXJSZWdpc3RyeSgpOiBTaWduYWxSZWdpc3RyeSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UucmVnaXN0cnk7XG4gIH0sXG4gIHByb3ZpZGVCdXN5U2lnbmFsKCk6IEJ1c3lTaWduYWxTZXJ2aWNlIHtcbiAgICBjb25zdCBwcm92aWRlcjogQnVzeVNpZ25hbFNlcnZpY2UgPSB0aGlzLmluc3RhbmNlLmF0b21JZGVQcm92aWRlcjtcbiAgICByZXR1cm4ge1xuICAgICAgcmVwb3J0QnVzeVdoaWxlPFQ+KFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBmOiAoKSA9PiBQcm9taXNlPFQ+LFxuICAgICAgICBvcHRpb25zPzogQnVzeVNpZ25hbE9wdGlvbnNcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gcHJvdmlkZXIucmVwb3J0QnVzeVdoaWxlKHRpdGxlLCBmLCBvcHRpb25zKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlcG9ydEJ1c3kodGl0bGU6IHN0cmluZywgb3B0aW9ucz86IEJ1c3lTaWduYWxPcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5yZXBvcnRCdXN5KHRpdGxlLCBvcHRpb25zKTtcbiAgICAgIH0sXG5cbiAgICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIC8vIG5vcFxuICAgICAgfVxuICAgIH07XG4gIH0sXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5pbnN0YW5jZS5kaXNwb3NlKCk7XG4gIH1cbn07XG4iXX0=