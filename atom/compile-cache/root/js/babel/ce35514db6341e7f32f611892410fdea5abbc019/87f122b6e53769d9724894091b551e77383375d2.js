var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var BusySignal = (function () {
  function BusySignal() {
    var _this = this;

    _classCallCheck(this, BusySignal);

    this.executing = new Set();
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(atom.config.observe('linter-ui-default.useBusySignal', function (useBusySignal) {
      _this.useBusySignal = useBusySignal;
    }));
  }

  _createClass(BusySignal, [{
    key: 'attach',
    value: function attach(registry) {
      this.provider = registry.create();
      this.update();
    }
  }, {
    key: 'update',
    value: function update() {
      var provider = this.provider;
      if (!provider) return;
      provider.clear();
      if (!this.useBusySignal) return;
      var fileMap = new Map();

      for (var _ref2 of this.executing) {
        var _filePath = _ref2.filePath;
        var _linter = _ref2.linter;

        var names = fileMap.get(_filePath);
        if (!names) {
          fileMap.set(_filePath, names = []);
        }
        names.push(_linter.name);
      }

      for (var _ref33 of fileMap) {
        var _ref32 = _slicedToArray(_ref33, 2);

        var _filePath2 = _ref32[0];
        var names = _ref32[1];

        var path = _filePath2 ? ' on ' + atom.project.relativizePath(_filePath2)[1] : '';
        provider.add('' + names.join(', ') + path);
      }
      fileMap.clear();
    }
  }, {
    key: 'getExecuting',
    value: function getExecuting(linter, filePath) {
      for (var entry of this.executing) {
        if (entry.linter === linter && entry.filePath === filePath) {
          return entry;
        }
      }
      return null;
    }
  }, {
    key: 'didBeginLinting',
    value: function didBeginLinting(linter, filePath) {
      if (this.getExecuting(linter, filePath)) {
        return;
      }
      this.executing.add({ linter: linter, filePath: filePath });
      this.update();
    }
  }, {
    key: 'didFinishLinting',
    value: function didFinishLinting(linter, filePath) {
      var entry = this.getExecuting(linter, filePath);
      if (entry) {
        this.executing['delete'](entry);
        this.update();
      }
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this.provider) {
        this.provider.clear();
      }
      this.executing.clear();
      this.subscriptions.dispose();
    }
  }]);

  return BusySignal;
})();

module.exports = BusySignal;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2J1c3ktc2lnbmFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztvQkFFb0MsTUFBTTs7SUFHcEMsVUFBVTtBQVNILFdBVFAsVUFBVSxHQVNBOzs7MEJBVFYsVUFBVTs7QUFVWixRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDMUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUNBQWlDLEVBQUUsVUFBQyxhQUFhLEVBQUs7QUFDL0YsWUFBSyxhQUFhLEdBQUcsYUFBYSxDQUFBO0tBQ25DLENBQUMsQ0FBQyxDQUFBO0dBQ0o7O2VBaEJHLFVBQVU7O1dBaUJSLGdCQUFDLFFBQWdCLEVBQUU7QUFDdkIsVUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUE7QUFDakMsVUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO0tBQ2Q7OztXQUNLLGtCQUFHO0FBQ1AsVUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtBQUM5QixVQUFJLENBQUMsUUFBUSxFQUFFLE9BQU07QUFDckIsY0FBUSxDQUFDLEtBQUssRUFBRSxDQUFBO0FBQ2hCLFVBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU07QUFDL0IsVUFBTSxPQUFvQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7O0FBRXRELHdCQUFtQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQXRDLFNBQVEsU0FBUixRQUFRO1lBQUUsT0FBTSxTQUFOLE1BQU07O0FBQzNCLFlBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUSxDQUFDLENBQUE7QUFDakMsWUFBSSxDQUFDLEtBQUssRUFBRTtBQUNWLGlCQUFPLENBQUMsR0FBRyxDQUFDLFNBQVEsRUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUE7U0FDbEM7QUFDRCxhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtPQUN4Qjs7QUFFRCx5QkFBZ0MsT0FBTyxFQUFFOzs7WUFBN0IsVUFBUTtZQUFFLEtBQUs7O0FBQ3pCLFlBQU0sSUFBSSxHQUFHLFVBQVEsWUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxVQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBSyxFQUFFLENBQUE7QUFDOUUsZ0JBQVEsQ0FBQyxHQUFHLE1BQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUcsQ0FBQTtPQUMzQztBQUNELGFBQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtLQUNoQjs7O1dBQ1csc0JBQUMsTUFBYyxFQUFFLFFBQWlCLEVBQVc7QUFDdkQsV0FBSyxJQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2xDLFlBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDMUQsaUJBQU8sS0FBSyxDQUFBO1NBQ2I7T0FDRjtBQUNELGFBQU8sSUFBSSxDQUFBO0tBQ1o7OztXQUNjLHlCQUFDLE1BQWMsRUFBRSxRQUFpQixFQUFFO0FBQ2pELFVBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUU7QUFDdkMsZUFBTTtPQUNQO0FBQ0QsVUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQU4sTUFBTSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsQ0FBQyxDQUFBO0FBQ3hDLFVBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtLQUNkOzs7V0FDZSwwQkFBQyxNQUFjLEVBQUUsUUFBaUIsRUFBRTtBQUNsRCxVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtBQUNqRCxVQUFJLEtBQUssRUFBRTtBQUNULFlBQUksQ0FBQyxTQUFTLFVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM1QixZQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7T0FDZDtLQUNGOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNqQixZQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO09BQ3RCO0FBQ0QsVUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUN0QixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO0tBQzdCOzs7U0F0RUcsVUFBVTs7O0FBeUVoQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9idXN5LXNpZ25hbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHR5cGUgeyBMaW50ZXIgfSBmcm9tICcuL3R5cGVzJ1xuXG5jbGFzcyBCdXN5U2lnbmFsIHtcbiAgcHJvdmlkZXI6ID9PYmplY3Q7XG4gIGV4ZWN1dGluZzogU2V0PHtcbiAgICBsaW50ZXI6IExpbnRlcixcbiAgICBmaWxlUGF0aDogP3N0cmluZyxcbiAgfT47XG4gIHVzZUJ1c3lTaWduYWw6IGJvb2xlYW47XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5leGVjdXRpbmcgPSBuZXcgU2V0KClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0LnVzZUJ1c3lTaWduYWwnLCAodXNlQnVzeVNpZ25hbCkgPT4ge1xuICAgICAgdGhpcy51c2VCdXN5U2lnbmFsID0gdXNlQnVzeVNpZ25hbFxuICAgIH0pKVxuICB9XG4gIGF0dGFjaChyZWdpc3RyeTogT2JqZWN0KSB7XG4gICAgdGhpcy5wcm92aWRlciA9IHJlZ2lzdHJ5LmNyZWF0ZSgpXG4gICAgdGhpcy51cGRhdGUoKVxuICB9XG4gIHVwZGF0ZSgpIHtcbiAgICBjb25zdCBwcm92aWRlciA9IHRoaXMucHJvdmlkZXJcbiAgICBpZiAoIXByb3ZpZGVyKSByZXR1cm5cbiAgICBwcm92aWRlci5jbGVhcigpXG4gICAgaWYgKCF0aGlzLnVzZUJ1c3lTaWduYWwpIHJldHVyblxuICAgIGNvbnN0IGZpbGVNYXA6IE1hcDw/c3RyaW5nLCBBcnJheTxzdHJpbmc+PiA9IG5ldyBNYXAoKVxuXG4gICAgZm9yIChjb25zdCB7IGZpbGVQYXRoLCBsaW50ZXIgfSBvZiB0aGlzLmV4ZWN1dGluZykge1xuICAgICAgbGV0IG5hbWVzID0gZmlsZU1hcC5nZXQoZmlsZVBhdGgpXG4gICAgICBpZiAoIW5hbWVzKSB7XG4gICAgICAgIGZpbGVNYXAuc2V0KGZpbGVQYXRoLCBuYW1lcyA9IFtdKVxuICAgICAgfVxuICAgICAgbmFtZXMucHVzaChsaW50ZXIubmFtZSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtmaWxlUGF0aCwgbmFtZXNdIG9mIGZpbGVNYXApIHtcbiAgICAgIGNvbnN0IHBhdGggPSBmaWxlUGF0aCA/IGAgb24gJHthdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZVBhdGgpWzFdfWAgOiAnJ1xuICAgICAgcHJvdmlkZXIuYWRkKGAke25hbWVzLmpvaW4oJywgJyl9JHtwYXRofWApXG4gICAgfVxuICAgIGZpbGVNYXAuY2xlYXIoKVxuICB9XG4gIGdldEV4ZWN1dGluZyhsaW50ZXI6IExpbnRlciwgZmlsZVBhdGg6ID9zdHJpbmcpOiA/T2JqZWN0IHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMuZXhlY3V0aW5nKSB7XG4gICAgICBpZiAoZW50cnkubGludGVyID09PSBsaW50ZXIgJiYgZW50cnkuZmlsZVBhdGggPT09IGZpbGVQYXRoKSB7XG4gICAgICAgIHJldHVybiBlbnRyeVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGRpZEJlZ2luTGludGluZyhsaW50ZXI6IExpbnRlciwgZmlsZVBhdGg6ID9zdHJpbmcpIHtcbiAgICBpZiAodGhpcy5nZXRFeGVjdXRpbmcobGludGVyLCBmaWxlUGF0aCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGluZy5hZGQoeyBsaW50ZXIsIGZpbGVQYXRoIH0pXG4gICAgdGhpcy51cGRhdGUoKVxuICB9XG4gIGRpZEZpbmlzaExpbnRpbmcobGludGVyOiBMaW50ZXIsIGZpbGVQYXRoOiA/c3RyaW5nKSB7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmdldEV4ZWN1dGluZyhsaW50ZXIsIGZpbGVQYXRoKVxuICAgIGlmIChlbnRyeSkge1xuICAgICAgdGhpcy5leGVjdXRpbmcuZGVsZXRlKGVudHJ5KVxuICAgICAgdGhpcy51cGRhdGUoKVxuICAgIH1cbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIGlmICh0aGlzLnByb3ZpZGVyKSB7XG4gICAgICB0aGlzLnByb3ZpZGVyLmNsZWFyKClcbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmcuY2xlYXIoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1c3lTaWduYWxcbiJdfQ==