Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _helpers = require('./helpers');

var _validate = require('./validate');

var ProvidersList = (function () {
  function ProvidersList() {
    _classCallCheck(this, ProvidersList);

    this.number = 0;
    this.providers = new Set();
  }

  _createClass(ProvidersList, [{
    key: 'addProvider',
    value: function addProvider(provider) {
      if (!this.hasProvider(provider)) {
        (0, _validate.provider)(provider);
        this.providers.add(provider);
      }
    }
  }, {
    key: 'hasProvider',
    value: function hasProvider(provider) {
      return this.providers.has(provider);
    }
  }, {
    key: 'deleteProvider',
    value: function deleteProvider(provider) {
      if (this.hasProvider(provider)) {
        this.providers['delete'](provider);
      }
    }
  }, {
    key: 'trigger',
    value: _asyncToGenerator(function* (textEditor) {
      var editorPath = textEditor.getPath();
      var bufferPosition = textEditor.getCursorBufferPosition();

      if (!editorPath) {
        return [];
      }

      var scopes = textEditor.scopeDescriptorForBufferPosition(bufferPosition).getScopesArray();
      scopes.push('*');

      var promises = [];
      this.providers.forEach(function (provider) {
        if (scopes.some(function (scope) {
          return provider.grammarScopes.indexOf(scope) !== -1;
        })) {
          promises.push(new Promise(function (resolve) {
            resolve(provider.getIntentions({ textEditor: textEditor, bufferPosition: bufferPosition }));
          }).then(function (results) {
            if (atom.inDevMode()) {
              (0, _validate.suggestionsList)(results);
            }
            return results;
          }));
        }
      });

      var number = ++this.number;
      var results = (yield Promise.all(promises)).reduce(function (items, item) {
        if (Array.isArray(item)) {
          return items.concat(item);
        }
        return items;
      }, []);

      if (number !== this.number || !results.length) {
        // If has been executed one more time, ignore these results
        // Or we don't have any results
        return [];
      }

      return (0, _helpers.processListItems)(results);
    })
  }, {
    key: 'dispose',
    value: function dispose() {
      this.providers.clear();
    }
  }]);

  return ProvidersList;
})();

exports['default'] = ProvidersList;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvcHJvdmlkZXJzLWxpc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt1QkFHaUMsV0FBVzs7d0JBQ3lDLFlBQVk7O0lBRzVFLGFBQWE7QUFJckIsV0FKUSxhQUFhLEdBSWxCOzBCQUpLLGFBQWE7O0FBSzlCLFFBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO0FBQ2YsUUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0dBQzNCOztlQVBrQixhQUFhOztXQVFyQixxQkFBQyxRQUFzQixFQUFFO0FBQ2xDLFVBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQy9CLGdDQUFpQixRQUFRLENBQUMsQ0FBQTtBQUMxQixZQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtPQUM3QjtLQUNGOzs7V0FDVSxxQkFBQyxRQUFzQixFQUFXO0FBQzNDLGFBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7S0FDcEM7OztXQUNhLHdCQUFDLFFBQXNCLEVBQUU7QUFDckMsVUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQzlCLFlBQUksQ0FBQyxTQUFTLFVBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtPQUNoQztLQUNGOzs7NkJBQ1ksV0FBQyxVQUFzQixFQUE0QjtBQUM5RCxVQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDdkMsVUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLHVCQUF1QixFQUFFLENBQUE7O0FBRTNELFVBQUksQ0FBQyxVQUFVLEVBQUU7QUFDZixlQUFPLEVBQUUsQ0FBQTtPQUNWOztBQUVELFVBQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxnQ0FBZ0MsQ0FBQyxjQUFjLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUMzRixZQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBOztBQUVoQixVQUFNLFFBQVEsR0FBRyxFQUFFLENBQUE7QUFDbkIsVUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBUyxRQUFRLEVBQUU7QUFDeEMsWUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSztpQkFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7U0FBQSxDQUFDLEVBQUU7QUFDdEUsa0JBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBUyxPQUFPLEVBQUU7QUFDMUMsbUJBQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBRSxjQUFjLEVBQWQsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFBO1dBQ2hFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBUyxPQUFPLEVBQUU7QUFDeEIsZ0JBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO0FBQ3BCLDZDQUFvQixPQUFPLENBQUMsQ0FBQTthQUM3QjtBQUNELG1CQUFPLE9BQU8sQ0FBQTtXQUNmLENBQUMsQ0FBQyxDQUFBO1NBQ0o7T0FDRixDQUFDLENBQUE7O0FBRUYsVUFBTSxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFBO0FBQzVCLFVBQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUUsTUFBTSxDQUFDLFVBQVMsS0FBSyxFQUFFLElBQUksRUFBRTtBQUN6RSxZQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDdkIsaUJBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUMxQjtBQUNELGVBQU8sS0FBSyxDQUFBO09BQ2IsRUFBRSxFQUFFLENBQUMsQ0FBQTs7QUFFTixVQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTs7O0FBRzdDLGVBQU8sRUFBRSxDQUFBO09BQ1Y7O0FBRUQsYUFBTywrQkFBaUIsT0FBTyxDQUFDLENBQUE7S0FDakM7OztXQUNNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtLQUN2Qjs7O1NBakVrQixhQUFhOzs7cUJBQWIsYUFBYSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL3Byb3ZpZGVycy1saXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHR5cGUgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IHByb2Nlc3NMaXN0SXRlbXMgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgeyBwcm92aWRlciBhcyB2YWxpZGF0ZVByb3ZpZGVyLCBzdWdnZXN0aW9uc0xpc3QgYXMgdmFsaWRhdGVTdWdnZXN0aW9ucyB9IGZyb20gJy4vdmFsaWRhdGUnXG5pbXBvcnQgdHlwZSB7IExpc3RQcm92aWRlciwgTGlzdEl0ZW0gfSBmcm9tICcuL3R5cGVzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm92aWRlcnNMaXN0IHtcbiAgbnVtYmVyOiBudW1iZXI7XG4gIHByb3ZpZGVyczogU2V0PExpc3RQcm92aWRlcj47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5udW1iZXIgPSAwXG4gICAgdGhpcy5wcm92aWRlcnMgPSBuZXcgU2V0KClcbiAgfVxuICBhZGRQcm92aWRlcihwcm92aWRlcjogTGlzdFByb3ZpZGVyKSB7XG4gICAgaWYgKCF0aGlzLmhhc1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgdmFsaWRhdGVQcm92aWRlcihwcm92aWRlcilcbiAgICAgIHRoaXMucHJvdmlkZXJzLmFkZChwcm92aWRlcilcbiAgICB9XG4gIH1cbiAgaGFzUHJvdmlkZXIocHJvdmlkZXI6IExpc3RQcm92aWRlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVycy5oYXMocHJvdmlkZXIpXG4gIH1cbiAgZGVsZXRlUHJvdmlkZXIocHJvdmlkZXI6IExpc3RQcm92aWRlcikge1xuICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgdGhpcy5wcm92aWRlcnMuZGVsZXRlKHByb3ZpZGVyKVxuICAgIH1cbiAgfVxuICBhc3luYyB0cmlnZ2VyKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPEFycmF5PExpc3RJdGVtPj4ge1xuICAgIGNvbnN0IGVkaXRvclBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKVxuICAgIGNvbnN0IGJ1ZmZlclBvc2l0aW9uID0gdGV4dEVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBpZiAoIWVkaXRvclBhdGgpIHtcbiAgICAgIHJldHVybiBbXVxuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlcyA9IHRleHRFZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUG9zaXRpb24pLmdldFNjb3Blc0FycmF5KClcbiAgICBzY29wZXMucHVzaCgnKicpXG5cbiAgICBjb25zdCBwcm9taXNlcyA9IFtdXG4gICAgdGhpcy5wcm92aWRlcnMuZm9yRWFjaChmdW5jdGlvbihwcm92aWRlcikge1xuICAgICAgaWYgKHNjb3Blcy5zb21lKHNjb3BlID0+IHByb3ZpZGVyLmdyYW1tYXJTY29wZXMuaW5kZXhPZihzY29wZSkgIT09IC0xKSkge1xuICAgICAgICBwcm9taXNlcy5wdXNoKG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgICByZXNvbHZlKHByb3ZpZGVyLmdldEludGVudGlvbnMoeyB0ZXh0RWRpdG9yLCBidWZmZXJQb3NpdGlvbiB9KSlcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgaWYgKGF0b20uaW5EZXZNb2RlKCkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlU3VnZ2VzdGlvbnMocmVzdWx0cylcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IG51bWJlciA9ICsrdGhpcy5udW1iZXJcbiAgICBjb25zdCByZXN1bHRzID0gKGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKSkucmVkdWNlKGZ1bmN0aW9uKGl0ZW1zLCBpdGVtKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgICByZXR1cm4gaXRlbXMuY29uY2F0KGl0ZW0pXG4gICAgICB9XG4gICAgICByZXR1cm4gaXRlbXNcbiAgICB9LCBbXSlcblxuICAgIGlmIChudW1iZXIgIT09IHRoaXMubnVtYmVyIHx8ICFyZXN1bHRzLmxlbmd0aCkge1xuICAgICAgLy8gSWYgaGFzIGJlZW4gZXhlY3V0ZWQgb25lIG1vcmUgdGltZSwgaWdub3JlIHRoZXNlIHJlc3VsdHNcbiAgICAgIC8vIE9yIHdlIGRvbid0IGhhdmUgYW55IHJlc3VsdHNcbiAgICAgIHJldHVybiBbXVxuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzTGlzdEl0ZW1zKHJlc3VsdHMpXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnByb3ZpZGVycy5jbGVhcigpXG4gIH1cbn1cbiJdfQ==