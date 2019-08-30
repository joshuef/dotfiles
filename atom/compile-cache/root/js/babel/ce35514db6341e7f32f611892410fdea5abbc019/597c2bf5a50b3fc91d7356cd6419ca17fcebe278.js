Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _atom = require('atom');

var _main = require('./main');

var _main2 = _interopRequireDefault(_main);

exports['default'] = {
  activate: function activate() {
    this.intentions = new _main2['default']();
    this.intentions.activate();
  },
  deactivate: function deactivate() {
    this.intentions.dispose();
  },
  consumeListIntentions: function consumeListIntentions(provider) {
    var _this = this;

    var providers = [].concat(provider);
    providers.forEach(function (entry) {
      _this.intentions.consumeListProvider(entry);
    });
    return new _atom.Disposable(function () {
      providers.forEach(function (entry) {
        _this.intentions.deleteListProvider(entry);
      });
    });
  },
  consumeHighlightIntentions: function consumeHighlightIntentions(provider) {
    var _this2 = this;

    var providers = [].concat(provider);
    providers.forEach(function (entry) {
      _this2.intentions.consumeHighlightProvider(entry);
    });
    return new _atom.Disposable(function () {
      providers.forEach(function (entry) {
        _this2.intentions.deleteHighlightProvider(entry);
      });
    });
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O29CQUUyQixNQUFNOztvQkFDVixRQUFROzs7O3FCQUdoQjtBQUNiLFVBQVEsRUFBQSxvQkFBRztBQUNULFFBQUksQ0FBQyxVQUFVLEdBQUcsdUJBQWdCLENBQUE7QUFDbEMsUUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtHQUMzQjtBQUNELFlBQVUsRUFBQSxzQkFBRztBQUNYLFFBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7R0FDMUI7QUFDRCx1QkFBcUIsRUFBQSwrQkFBQyxRQUE0QyxFQUFFOzs7QUFDbEUsUUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNyQyxhQUFTLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3pCLFlBQUssVUFBVSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQzNDLENBQUMsQ0FBQTtBQUNGLFdBQU8scUJBQWUsWUFBTTtBQUMxQixlQUFTLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3pCLGNBQUssVUFBVSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFBO09BQzFDLENBQUMsQ0FBQTtLQUNILENBQUMsQ0FBQTtHQUNIO0FBQ0QsNEJBQTBCLEVBQUEsb0NBQUMsUUFBc0QsRUFBRTs7O0FBQ2pGLFFBQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7QUFDckMsYUFBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUN6QixhQUFLLFVBQVUsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUNoRCxDQUFDLENBQUE7QUFDRixXQUFPLHFCQUFlLFlBQU07QUFDMUIsZUFBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUN6QixlQUFLLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUMvQyxDQUFDLENBQUE7S0FDSCxDQUFDLENBQUE7R0FDSDtDQUNGIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBJbnRlbnRpb25zIGZyb20gJy4vbWFpbidcbmltcG9ydCB0eXBlIHsgTGlzdFByb3ZpZGVyLCBIaWdobGlnaHRQcm92aWRlciB9IGZyb20gJy4vdHlwZXMnXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5pbnRlbnRpb25zID0gbmV3IEludGVudGlvbnMoKVxuICAgIHRoaXMuaW50ZW50aW9ucy5hY3RpdmF0ZSgpXG4gIH0sXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5pbnRlbnRpb25zLmRpc3Bvc2UoKVxuICB9LFxuICBjb25zdW1lTGlzdEludGVudGlvbnMocHJvdmlkZXI6IExpc3RQcm92aWRlciB8IEFycmF5PExpc3RQcm92aWRlcj4pIHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXS5jb25jYXQocHJvdmlkZXIpXG4gICAgcHJvdmlkZXJzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgdGhpcy5pbnRlbnRpb25zLmNvbnN1bWVMaXN0UHJvdmlkZXIoZW50cnkpXG4gICAgfSlcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgcHJvdmlkZXJzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICB0aGlzLmludGVudGlvbnMuZGVsZXRlTGlzdFByb3ZpZGVyKGVudHJ5KVxuICAgICAgfSlcbiAgICB9KVxuICB9LFxuICBjb25zdW1lSGlnaGxpZ2h0SW50ZW50aW9ucyhwcm92aWRlcjogSGlnaGxpZ2h0UHJvdmlkZXIgfCBBcnJheTxIaWdobGlnaHRQcm92aWRlcj4pIHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXS5jb25jYXQocHJvdmlkZXIpXG4gICAgcHJvdmlkZXJzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgdGhpcy5pbnRlbnRpb25zLmNvbnN1bWVIaWdobGlnaHRQcm92aWRlcihlbnRyeSlcbiAgICB9KVxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBwcm92aWRlcnMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHRoaXMuaW50ZW50aW9ucy5kZWxldGVIaWdobGlnaHRQcm92aWRlcihlbnRyeSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfSxcbn1cbiJdfQ==