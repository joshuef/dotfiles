Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var SelectListView = undefined;

var ToggleProviders = (function () {
  function ToggleProviders(action, providers) {
    var _this = this;

    _classCallCheck(this, ToggleProviders);

    this.action = action;
    this.emitter = new _atom.Emitter();
    this.providers = providers;
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.config.observe('linter.disabledProviders', function (disabledProviders) {
      _this.disabledProviders = disabledProviders;
    }));
  }

  _createClass(ToggleProviders, [{
    key: 'getItems',
    value: _asyncToGenerator(function* () {
      var _this2 = this;

      if (this.action === 'disable') {
        return this.providers.filter(function (name) {
          return !_this2.disabledProviders.includes(name);
        });
      }
      return this.disabledProviders;
    })
  }, {
    key: 'process',
    value: _asyncToGenerator(function* (name) {
      if (this.action === 'disable') {
        this.disabledProviders.push(name);
        this.emitter.emit('did-disable', name);
      } else {
        var index = this.disabledProviders.indexOf(name);
        if (index !== -1) {
          this.disabledProviders.splice(index, 1);
        }
      }
      atom.config.set('linter.disabledProviders', this.disabledProviders);
    })
  }, {
    key: 'show',
    value: _asyncToGenerator(function* () {
      var _this3 = this;

      if (!SelectListView) {
        SelectListView = require('atom-select-list');
      }
      var selectListView = new SelectListView({
        items: yield this.getItems(),
        emptyMessage: 'No matches found',
        elementForItem: function elementForItem(item) {
          var li = document.createElement('li');
          li.textContent = item;
          return li;
        },
        didConfirmSelection: function didConfirmSelection(item) {
          _this3.process(item)['catch'](function (e) {
            return console.error('[Linter] Unable to process toggle:', e);
          }).then(function () {
            return _this3.dispose();
          });
        },
        didCancelSelection: function didCancelSelection() {
          _this3.dispose();
        },
        didConfirmEmptySelection: function didConfirmEmptySelection() {
          _this3.dispose();
        }
      });
      var panel = atom.workspace.addModalPanel({ item: selectListView });

      selectListView.focus();
      this.subscriptions.add(new _atom.Disposable(function () {
        panel.destroy();
      }));
    })
  }, {
    key: 'onDidDispose',
    value: function onDidDispose(callback) {
      return this.emitter.on('did-dispose', callback);
    }
  }, {
    key: 'onDidDisable',
    value: function onDidDisable(callback) {
      return this.emitter.on('did-disable', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-dispose');
      this.subscriptions.dispose();
    }
  }]);

  return ToggleProviders;
})();

exports['default'] = ToggleProviders;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi90b2dnbGUtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUV5RCxNQUFNOztBQUUvRCxJQUFJLGNBQWMsWUFBQSxDQUFBOztJQUdaLGVBQWU7QUFPUixXQVBQLGVBQWUsQ0FPUCxNQUFvQixFQUFFLFNBQXdCLEVBQUU7OzswQkFQeEQsZUFBZTs7QUFRakIsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7QUFDcEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO0FBQzFCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNwQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsMEJBQTBCLEVBQUUsVUFBQSxpQkFBaUIsRUFBSTtBQUNuRSxZQUFLLGlCQUFpQixHQUFHLGlCQUFpQixDQUFBO0tBQzNDLENBQUMsQ0FDSCxDQUFBO0dBQ0Y7O2VBbkJHLGVBQWU7OzZCQW9CTCxhQUEyQjs7O0FBQ3ZDLFVBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7QUFDN0IsZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUk7aUJBQUksQ0FBQyxPQUFLLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7U0FBQSxDQUFDLENBQUE7T0FDN0U7QUFDRCxhQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQTtLQUM5Qjs7OzZCQUNZLFdBQUMsSUFBWSxFQUFpQjtBQUN6QyxVQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQzdCLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDakMsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO09BQ3ZDLE1BQU07QUFDTCxZQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2xELFlBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2hCLGNBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFBO1NBQ3hDO09BQ0Y7QUFDRCxVQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtLQUNwRTs7OzZCQUNTLGFBQUc7OztBQUNYLFVBQUksQ0FBQyxjQUFjLEVBQUU7QUFDbkIsc0JBQWMsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtPQUM3QztBQUNELFVBQU0sY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDO0FBQ3hDLGFBQUssRUFBRSxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDNUIsb0JBQVksRUFBRSxrQkFBa0I7QUFDaEMsc0JBQWMsRUFBRSx3QkFBQSxJQUFJLEVBQUk7QUFDdEIsY0FBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN2QyxZQUFFLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQTtBQUNyQixpQkFBTyxFQUFFLENBQUE7U0FDVjtBQUNELDJCQUFtQixFQUFFLDZCQUFBLElBQUksRUFBSTtBQUMzQixpQkFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQ1YsQ0FBQyxVQUFBLENBQUM7bUJBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDLENBQUM7V0FBQSxDQUFDLENBQ2xFLElBQUksQ0FBQzttQkFBTSxPQUFLLE9BQU8sRUFBRTtXQUFBLENBQUMsQ0FBQTtTQUM5QjtBQUNELDBCQUFrQixFQUFFLDhCQUFNO0FBQ3hCLGlCQUFLLE9BQU8sRUFBRSxDQUFBO1NBQ2Y7QUFDRCxnQ0FBd0IsRUFBRSxvQ0FBTTtBQUM5QixpQkFBSyxPQUFPLEVBQUUsQ0FBQTtTQUNmO09BQ0YsQ0FBQyxDQUFBO0FBQ0YsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTs7QUFFcEUsb0JBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUN0QixVQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIscUJBQWUsWUFBVztBQUN4QixhQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDaEIsQ0FBQyxDQUNILENBQUE7S0FDRjs7O1dBQ1csc0JBQUMsUUFBbUIsRUFBYztBQUM1QyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNoRDs7O1dBQ1csc0JBQUMsUUFBK0IsRUFBYztBQUN4RCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQTtLQUNoRDs7O1dBQ00sbUJBQUc7QUFDUixVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0FoRkcsZUFBZTs7O3FCQW1GTixlQUFlIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi90b2dnbGUtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEVtaXR0ZXIsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuXG5sZXQgU2VsZWN0TGlzdFZpZXdcbnR5cGUgVG9nZ2xlQWN0aW9uID0gJ2VuYWJsZScgfCAnZGlzYWJsZSdcblxuY2xhc3MgVG9nZ2xlUHJvdmlkZXJzIHtcbiAgYWN0aW9uOiBUb2dnbGVBY3Rpb25cbiAgZW1pdHRlcjogRW1pdHRlclxuICBwcm92aWRlcnM6IEFycmF5PHN0cmluZz5cbiAgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZVxuICBkaXNhYmxlZFByb3ZpZGVyczogQXJyYXk8c3RyaW5nPlxuXG4gIGNvbnN0cnVjdG9yKGFjdGlvbjogVG9nZ2xlQWN0aW9uLCBwcm92aWRlcnM6IEFycmF5PHN0cmluZz4pIHtcbiAgICB0aGlzLmFjdGlvbiA9IGFjdGlvblxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLnByb3ZpZGVycyA9IHByb3ZpZGVyc1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXIuZGlzYWJsZWRQcm92aWRlcnMnLCBkaXNhYmxlZFByb3ZpZGVycyA9PiB7XG4gICAgICAgIHRoaXMuZGlzYWJsZWRQcm92aWRlcnMgPSBkaXNhYmxlZFByb3ZpZGVyc1xuICAgICAgfSksXG4gICAgKVxuICB9XG4gIGFzeW5jIGdldEl0ZW1zKCk6IFByb21pc2U8QXJyYXk8c3RyaW5nPj4ge1xuICAgIGlmICh0aGlzLmFjdGlvbiA9PT0gJ2Rpc2FibGUnKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm92aWRlcnMuZmlsdGVyKG5hbWUgPT4gIXRoaXMuZGlzYWJsZWRQcm92aWRlcnMuaW5jbHVkZXMobmFtZSkpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRpc2FibGVkUHJvdmlkZXJzXG4gIH1cbiAgYXN5bmMgcHJvY2VzcyhuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5hY3Rpb24gPT09ICdkaXNhYmxlJykge1xuICAgICAgdGhpcy5kaXNhYmxlZFByb3ZpZGVycy5wdXNoKG5hbWUpXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWRpc2FibGUnLCBuYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMuZGlzYWJsZWRQcm92aWRlcnMuaW5kZXhPZihuYW1lKVxuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLmRpc2FibGVkUHJvdmlkZXJzLnNwbGljZShpbmRleCwgMSlcbiAgICAgIH1cbiAgICB9XG4gICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXIuZGlzYWJsZWRQcm92aWRlcnMnLCB0aGlzLmRpc2FibGVkUHJvdmlkZXJzKVxuICB9XG4gIGFzeW5jIHNob3coKSB7XG4gICAgaWYgKCFTZWxlY3RMaXN0Vmlldykge1xuICAgICAgU2VsZWN0TGlzdFZpZXcgPSByZXF1aXJlKCdhdG9tLXNlbGVjdC1saXN0JylcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0TGlzdFZpZXcgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xuICAgICAgaXRlbXM6IGF3YWl0IHRoaXMuZ2V0SXRlbXMoKSxcbiAgICAgIGVtcHR5TWVzc2FnZTogJ05vIG1hdGNoZXMgZm91bmQnLFxuICAgICAgZWxlbWVudEZvckl0ZW06IGl0ZW0gPT4ge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICAgICAgbGkudGV4dENvbnRlbnQgPSBpdGVtXG4gICAgICAgIHJldHVybiBsaVxuICAgICAgfSxcbiAgICAgIGRpZENvbmZpcm1TZWxlY3Rpb246IGl0ZW0gPT4ge1xuICAgICAgICB0aGlzLnByb2Nlc3MoaXRlbSlcbiAgICAgICAgICAuY2F0Y2goZSA9PiBjb25zb2xlLmVycm9yKCdbTGludGVyXSBVbmFibGUgdG8gcHJvY2VzcyB0b2dnbGU6JywgZSkpXG4gICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5kaXNwb3NlKCkpXG4gICAgICB9LFxuICAgICAgZGlkQ2FuY2VsU2VsZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpXG4gICAgICB9LFxuICAgICAgZGlkQ29uZmlybUVtcHR5U2VsZWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpXG4gICAgICB9LFxuICAgIH0pXG4gICAgY29uc3QgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogc2VsZWN0TGlzdFZpZXcgfSlcblxuICAgIHNlbGVjdExpc3RWaWV3LmZvY3VzKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgbmV3IERpc3Bvc2FibGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhbmVsLmRlc3Ryb3koKVxuICAgICAgfSksXG4gICAgKVxuICB9XG4gIG9uRGlkRGlzcG9zZShjYWxsYmFjazogKCkgPT4gYW55KTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWRpc3Bvc2UnLCBjYWxsYmFjaylcbiAgfVxuICBvbkRpZERpc2FibGUoY2FsbGJhY2s6IChuYW1lOiBzdHJpbmcpID0+IGFueSk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kaXNhYmxlJywgY2FsbGJhY2spXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWRpc3Bvc2UnKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUb2dnbGVQcm92aWRlcnNcbiJdfQ==