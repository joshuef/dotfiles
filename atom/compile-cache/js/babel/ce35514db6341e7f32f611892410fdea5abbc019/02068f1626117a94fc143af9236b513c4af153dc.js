'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var AutocompleteModulesPlugin = (function () {
  function AutocompleteModulesPlugin() {
    _classCallCheck(this, AutocompleteModulesPlugin);

    this.config = require('./package-configs').registrar;
    this.completionProvider = null;
  }

  _createClass(AutocompleteModulesPlugin, [{
    key: 'activate',
    value: function activate() {
      this.completionProvider = new (require('./completion-provider'))();
    }
  }, {
    key: 'deactivate',
    value: function deactivate() {
      delete this.completionProvider;
      this.completionProvider = null;
    }
  }, {
    key: 'getCompletionProvider',
    value: function getCompletionProvider() {
      return this.completionProvider;
    }
  }]);

  return AutocompleteModulesPlugin;
})();

module.exports = new AutocompleteModulesPlugin();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7SUFFTix5QkFBeUI7QUFDbEIsV0FEUCx5QkFBeUIsR0FDZjswQkFEVix5QkFBeUI7O0FBRTNCLFFBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3JELFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7R0FDaEM7O2VBSkcseUJBQXlCOztXQU1yQixvQkFBRztBQUNULFVBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLE9BQU8sQ0FBQyx1QkFBdUIsRUFBQyxFQUFDLENBQUM7S0FDbEU7OztXQUVTLHNCQUFHO0FBQ1gsYUFBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7QUFDL0IsVUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztLQUNoQzs7O1dBRW9CLGlDQUFHO0FBQ3RCLGFBQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO0tBQ2hDOzs7U0FqQkcseUJBQXlCOzs7QUFvQi9CLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSx5QkFBeUIsRUFBRSxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLW1vZHVsZXMvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuY2xhc3MgQXV0b2NvbXBsZXRlTW9kdWxlc1BsdWdpbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29uZmlnID0gcmVxdWlyZSgnLi9wYWNrYWdlLWNvbmZpZ3MnKS5yZWdpc3RyYXI7XG4gICAgdGhpcy5jb21wbGV0aW9uUHJvdmlkZXIgPSBudWxsO1xuICB9XG5cbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5jb21wbGV0aW9uUHJvdmlkZXIgPSBuZXcgKHJlcXVpcmUoJy4vY29tcGxldGlvbi1wcm92aWRlcicpKTtcbiAgfVxuXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgZGVsZXRlIHRoaXMuY29tcGxldGlvblByb3ZpZGVyO1xuICAgIHRoaXMuY29tcGxldGlvblByb3ZpZGVyID0gbnVsbDtcbiAgfVxuXG4gIGdldENvbXBsZXRpb25Qcm92aWRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wbGV0aW9uUHJvdmlkZXI7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQXV0b2NvbXBsZXRlTW9kdWxlc1BsdWdpbigpO1xuIl19