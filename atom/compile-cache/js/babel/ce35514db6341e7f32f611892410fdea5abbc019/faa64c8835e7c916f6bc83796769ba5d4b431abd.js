Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// eslint-disable-next-line import/no-unresolved

var _atom = require("atom");

var _helpers = require("./helpers");

var Provider = (function () {
  function Provider() {
    _classCallCheck(this, Provider);

    this.id = (0, _helpers.generateRandom)();
    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
  }

  // Public

  _createClass(Provider, [{
    key: "add",
    value: function add(title, options) {
      this.emitter.emit("did-add", { title: title, options: options });
    }

    // Public
  }, {
    key: "remove",
    value: function remove(title) {
      this.emitter.emit("did-remove", title);
    }

    // Public
  }, {
    key: "changeTitle",
    value: function changeTitle(title, oldTitle) {
      this.emitter.emit("did-change-title", { title: title, oldTitle: oldTitle });
    }

    // Public
  }, {
    key: "clear",
    value: function clear() {
      this.emitter.emit("did-clear");
    }
  }, {
    key: "onDidAdd",
    value: function onDidAdd(callback) {
      return this.emitter.on("did-add", callback);
    }
  }, {
    key: "onDidRemove",
    value: function onDidRemove(callback) {
      return this.emitter.on("did-remove", callback);
    }
  }, {
    key: "onDidChangeTitle",
    value: function onDidChangeTitle(callback) {
      return this.emitter.on("did-change-title", callback);
    }
  }, {
    key: "onDidClear",
    value: function onDidClear(callback) {
      return this.emitter.on("did-clear", callback);
    }
  }, {
    key: "onDidDispose",
    value: function onDidDispose(callback) {
      return this.emitter.on("did-dispose", callback);
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.emitter.emit("did-dispose");
      this.subscriptions.dispose();
    }
  }]);

  return Provider;
})();

exports["default"] = Provider;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL3Byb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7b0JBRzZDLE1BQU07O3VCQUNwQixXQUFXOztJQUdyQixRQUFRO0FBS2hCLFdBTFEsUUFBUSxHQUtiOzBCQUxLLFFBQVE7O0FBTXpCLFFBQUksQ0FBQyxFQUFFLEdBQUcsOEJBQWdCLENBQUM7QUFDM0IsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFDO0FBQzdCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUM7O0FBRS9DLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUN0Qzs7OztlQVhrQixRQUFROztXQWN4QixhQUFDLEtBQWEsRUFBRSxPQUF3QixFQUFFO0FBQzNDLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxDQUFDLENBQUM7S0FDbEQ7Ozs7O1dBRUssZ0JBQUMsS0FBYSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN4Qzs7Ozs7V0FFVSxxQkFBQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRTtBQUMzQyxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDNUQ7Ozs7O1dBRUksaUJBQUc7QUFDTixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNoQzs7O1dBRU8sa0JBQ04sUUFBa0UsRUFDckQ7QUFDYixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUM3Qzs7O1dBQ1UscUJBQUMsUUFBZ0MsRUFBZTtBQUN6RCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNoRDs7O1dBQ2UsMEJBQ2QsUUFBOEQsRUFDakQ7QUFDYixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ3REOzs7V0FDUyxvQkFBQyxRQUFtQixFQUFlO0FBQzNDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQy9DOzs7V0FDVyxzQkFBQyxRQUFrQixFQUFlO0FBQzVDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2pEOzs7V0FFTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2pDLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDOUI7OztTQXJEa0IsUUFBUTs7O3FCQUFSLFFBQVEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9idXN5LXNpZ25hbC9saWIvcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLXVucmVzb2x2ZWRcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgZ2VuZXJhdGVSYW5kb20gfSBmcm9tIFwiLi9oZWxwZXJzXCI7XG5pbXBvcnQgdHlwZSB7IFNpZ25hbE9wdGlvbnMgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm92aWRlciB7XG4gIGlkOiBzdHJpbmc7XG4gIGVtaXR0ZXI6IEVtaXR0ZXI7XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5pZCA9IGdlbmVyYXRlUmFuZG9tKCk7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVtaXR0ZXIpO1xuICB9XG5cbiAgLy8gUHVibGljXG4gIGFkZCh0aXRsZTogc3RyaW5nLCBvcHRpb25zPzogP1NpZ25hbE9wdGlvbnMpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC1hZGRcIiwgeyB0aXRsZSwgb3B0aW9ucyB9KTtcbiAgfVxuICAvLyBQdWJsaWNcbiAgcmVtb3ZlKHRpdGxlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC1yZW1vdmVcIiwgdGl0bGUpO1xuICB9XG4gIC8vIFB1YmxpY1xuICBjaGFuZ2VUaXRsZSh0aXRsZTogc3RyaW5nLCBvbGRUaXRsZTogc3RyaW5nKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoXCJkaWQtY2hhbmdlLXRpdGxlXCIsIHsgdGl0bGUsIG9sZFRpdGxlIH0pO1xuICB9XG4gIC8vIFB1YmxpY1xuICBjbGVhcigpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRpZC1jbGVhclwiKTtcbiAgfVxuXG4gIG9uRGlkQWRkKFxuICAgIGNhbGxiYWNrOiAoYWRkOiB7IHRpdGxlOiBzdHJpbmcsIG9wdGlvbnM6ID9TaWduYWxPcHRpb25zIH0pID0+IGFueVxuICApOiBJRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbihcImRpZC1hZGRcIiwgY2FsbGJhY2spO1xuICB9XG4gIG9uRGlkUmVtb3ZlKGNhbGxiYWNrOiAodGl0bGU6IHN0cmluZykgPT4gYW55KTogSURpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oXCJkaWQtcmVtb3ZlXCIsIGNhbGxiYWNrKTtcbiAgfVxuICBvbkRpZENoYW5nZVRpdGxlKFxuICAgIGNhbGxiYWNrOiAoY2hhbmdlOiB7IHRpdGxlOiBzdHJpbmcsIG9sZFRpdGxlOiBzdHJpbmcgfSkgPT4gYW55XG4gICk6IElEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKFwiZGlkLWNoYW5nZS10aXRsZVwiLCBjYWxsYmFjayk7XG4gIH1cbiAgb25EaWRDbGVhcihjYWxsYmFjazogKCkgPT4gYW55KTogSURpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oXCJkaWQtY2xlYXJcIiwgY2FsbGJhY2spO1xuICB9XG4gIG9uRGlkRGlzcG9zZShjYWxsYmFjazogRnVuY3Rpb24pOiBJRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbihcImRpZC1kaXNwb3NlXCIsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoXCJkaWQtZGlzcG9zZVwiKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9XG59XG4iXX0=