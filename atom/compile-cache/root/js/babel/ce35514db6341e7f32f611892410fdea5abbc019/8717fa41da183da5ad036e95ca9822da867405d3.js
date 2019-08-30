Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('./helpers');

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
    key: 'add',
    value: function add(title) {
      this.emitter.emit('did-add', title);
    }

    // Public
  }, {
    key: 'remove',
    value: function remove(title) {
      this.emitter.emit('did-remove', title);
    }

    // Public
  }, {
    key: 'clear',
    value: function clear() {
      this.emitter.emit('did-clear');
    }
  }, {
    key: 'onDidAdd',
    value: function onDidAdd(callback) {
      return this.emitter.on('did-add', callback);
    }
  }, {
    key: 'onDidRemove',
    value: function onDidRemove(callback) {
      return this.emitter.on('did-remove', callback);
    }
  }, {
    key: 'onDidClear',
    value: function onDidClear(callback) {
      return this.emitter.on('did-clear', callback);
    }
  }, {
    key: 'onDidDispose',
    value: function onDidDispose(callback) {
      return this.emitter.on('did-dispose', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-dispose');
      this.subscriptions.dispose();
    }
  }]);

  return Provider;
})();

exports['default'] = Provider;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL3Byb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUU2QyxNQUFNOzt1QkFFcEIsV0FBVzs7SUFFckIsUUFBUTtBQUtoQixXQUxRLFFBQVEsR0FLYjswQkFMSyxRQUFROztBQU16QixRQUFJLENBQUMsRUFBRSxHQUFHLDhCQUFnQixDQUFBO0FBQzFCLFFBQUksQ0FBQyxPQUFPLEdBQUcsbUJBQWEsQ0FBQTtBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBOztBQUU5QyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDckM7Ozs7ZUFYa0IsUUFBUTs7V0FheEIsYUFBQyxLQUFhLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3BDOzs7OztXQUVLLGdCQUFDLEtBQWEsRUFBRTtBQUNwQixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDdkM7Ozs7O1dBRUksaUJBQUc7QUFDTixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtLQUMvQjs7O1dBQ08sa0JBQUMsUUFBa0MsRUFBYztBQUN2RCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUM1Qzs7O1dBQ1UscUJBQUMsUUFBa0MsRUFBYztBQUMxRCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUMvQzs7O1dBQ1Msb0JBQUMsUUFBcUIsRUFBYztBQUM1QyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUM5Qzs7O1dBQ1csc0JBQUMsUUFBa0IsRUFBYztBQUMzQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNoRDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0F2Q2tCLFFBQVE7OztxQkFBUixRQUFRIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYnVzeS1zaWduYWwvbGliL3Byb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRW1pdHRlciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSB7IERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgZ2VuZXJhdGVSYW5kb20gfSBmcm9tICcuL2hlbHBlcnMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb3ZpZGVyIHtcbiAgaWQ6IHN0cmluZztcbiAgZW1pdHRlcjogRW1pdHRlcjtcbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmlkID0gZ2VuZXJhdGVSYW5kb20oKVxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZW1pdHRlcilcbiAgfVxuICAvLyBQdWJsaWNcbiAgYWRkKHRpdGxlOiBzdHJpbmcpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWFkZCcsIHRpdGxlKVxuICB9XG4gIC8vIFB1YmxpY1xuICByZW1vdmUodGl0bGU6IHN0cmluZykge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtcmVtb3ZlJywgdGl0bGUpXG4gIH1cbiAgLy8gUHVibGljXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2xlYXInKVxuICB9XG4gIG9uRGlkQWRkKGNhbGxiYWNrOiAoKHRpdGxlOiBzdHJpbmcpID0+IGFueSkpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtYWRkJywgY2FsbGJhY2spXG4gIH1cbiAgb25EaWRSZW1vdmUoY2FsbGJhY2s6ICgodGl0bGU6IHN0cmluZykgPT4gYW55KSk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1yZW1vdmUnLCBjYWxsYmFjaylcbiAgfVxuICBvbkRpZENsZWFyKGNhbGxiYWNrOiAoKCkgPT4gYW55KSk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jbGVhcicsIGNhbGxiYWNrKVxuICB9XG4gIG9uRGlkRGlzcG9zZShjYWxsYmFjazogRnVuY3Rpb24pOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtZGlzcG9zZScsIGNhbGxiYWNrKVxuICB9XG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1kaXNwb3NlJylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH1cbn1cbiJdfQ==