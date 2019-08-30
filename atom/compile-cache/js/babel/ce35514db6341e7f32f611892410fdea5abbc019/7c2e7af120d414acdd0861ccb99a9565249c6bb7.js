Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('atom');

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

// Internal variables
var instance = undefined;

exports['default'] = {
  activate: function activate() {
    this.subscriptions = new _atom.CompositeDisposable();

    instance = new _main2['default']();
    this.subscriptions.add(instance);

    this.subscriptions.add(atom.packages.onDidActivateInitialPackages(function () {
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter', true);
      }
    }));
  },
  consumeLinter: function consumeLinter(linter) {
    var linters = [].concat(linter);
    for (var entry of linters) {
      instance.addLinter(entry);
    }
    return new _atom.Disposable(function () {
      for (var entry of linters) {
        instance.deleteLinter(entry);
      }
    });
  },
  consumeUI: function consumeUI(ui) {
    var uis = [].concat(ui);
    for (var entry of uis) {
      instance.addUI(entry);
    }
    return new _atom.Disposable(function () {
      for (var entry of uis) {
        instance.deleteUI(entry);
      }
    });
  },
  provideIndie: function provideIndie() {
    return function (indie) {
      return instance.addIndie(indie);
    };
  },
  deactivate: function deactivate() {
    this.subscriptions.dispose();
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7b0JBRWdELE1BQU07O29CQUVuQyxRQUFROzs7OztBQUkzQixJQUFJLFFBQVEsWUFBQSxDQUFBOztxQkFFRztBQUNiLFVBQVEsRUFBQSxvQkFBRztBQUNULFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFlBQVEsR0FBRyx1QkFBWSxDQUFBO0FBQ3ZCLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBOztBQUVoQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxZQUFXO0FBQ3BELFVBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUU7QUFDdEIsZUFBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtPQUNyRDtLQUNGLENBQUMsQ0FDSCxDQUFBO0dBQ0Y7QUFDRCxlQUFhLEVBQUEsdUJBQUMsTUFBc0IsRUFBYztBQUNoRCxRQUFNLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQ2pDLFNBQUssSUFBTSxLQUFLLElBQUksT0FBTyxFQUFFO0FBQzNCLGNBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDMUI7QUFDRCxXQUFPLHFCQUFlLFlBQU07QUFDMUIsV0FBSyxJQUFNLEtBQUssSUFBSSxPQUFPLEVBQUU7QUFDM0IsZ0JBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7T0FDN0I7S0FDRixDQUFDLENBQUE7R0FDSDtBQUNELFdBQVMsRUFBQSxtQkFBQyxFQUFNLEVBQWM7QUFDNUIsUUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUN6QixTQUFLLElBQU0sS0FBSyxJQUFJLEdBQUcsRUFBRTtBQUN2QixjQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ3RCO0FBQ0QsV0FBTyxxQkFBZSxZQUFNO0FBQzFCLFdBQUssSUFBTSxLQUFLLElBQUksR0FBRyxFQUFFO0FBQ3ZCLGdCQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO09BQ3pCO0tBQ0YsQ0FBQyxDQUFBO0dBQ0g7QUFDRCxjQUFZLEVBQUEsd0JBQVc7QUFDckIsV0FBTyxVQUFBLEtBQUs7YUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztLQUFBLENBQUE7R0FDekM7QUFDRCxZQUFVLEVBQUEsc0JBQUc7QUFDWCxRQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0dBQzdCO0NBQ0YiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmltcG9ydCBMaW50ZXIgZnJvbSAnLi9tYWluJ1xuaW1wb3J0IHR5cGUgeyBVSSwgTGludGVyIGFzIExpbnRlclByb3ZpZGVyIH0gZnJvbSAnLi90eXBlcydcblxuLy8gSW50ZXJuYWwgdmFyaWFibGVzXG5sZXQgaW5zdGFuY2VcblxuZXhwb3J0IGRlZmF1bHQge1xuICBhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICBpbnN0YW5jZSA9IG5ldyBMaW50ZXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoaW5zdGFuY2UpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5wYWNrYWdlcy5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzKGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWF0b20uaW5TcGVjTW9kZSgpKSB7XG4gICAgICAgICAgcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcHMnKS5pbnN0YWxsKCdsaW50ZXInLCB0cnVlKVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApXG4gIH0sXG4gIGNvbnN1bWVMaW50ZXIobGludGVyOiBMaW50ZXJQcm92aWRlcik6IERpc3Bvc2FibGUge1xuICAgIGNvbnN0IGxpbnRlcnMgPSBbXS5jb25jYXQobGludGVyKVxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgbGludGVycykge1xuICAgICAgaW5zdGFuY2UuYWRkTGludGVyKGVudHJ5KVxuICAgIH1cbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBsaW50ZXJzKSB7XG4gICAgICAgIGluc3RhbmNlLmRlbGV0ZUxpbnRlcihlbnRyeSlcbiAgICAgIH1cbiAgICB9KVxuICB9LFxuICBjb25zdW1lVUkodWk6IFVJKTogRGlzcG9zYWJsZSB7XG4gICAgY29uc3QgdWlzID0gW10uY29uY2F0KHVpKVxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgdWlzKSB7XG4gICAgICBpbnN0YW5jZS5hZGRVSShlbnRyeSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgdWlzKSB7XG4gICAgICAgIGluc3RhbmNlLmRlbGV0ZVVJKGVudHJ5KVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG4gIHByb3ZpZGVJbmRpZSgpOiBPYmplY3Qge1xuICAgIHJldHVybiBpbmRpZSA9PiBpbnN0YW5jZS5hZGRJbmRpZShpbmRpZSlcbiAgfSxcbiAgZGVhY3RpdmF0ZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gIH0sXG59XG4iXX0=