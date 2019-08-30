Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = greet;

var _templateObject = _taggedTemplateLiteral(['\n      Hi Linter user! 👋\n\n      Linter has been upgraded to v2.\n\n      Packages compatible with v1 will keep working on v2 for a long time.\n      If you are a package author, I encourage you to upgrade your package to the Linter v2 API.\n\n      You can read [the announcement post on my blog](http://steelbrain.me/2017/03/13/linter-v2-released.html).\n    '], ['\n      Hi Linter user! 👋\n\n      Linter has been upgraded to v2.\n\n      Packages compatible with v1 will keep working on v2 for a long time.\n      If you are a package author, I encourage you to upgrade your package to the Linter v2 API.\n\n      You can read [the announcement post on my blog](http://steelbrain.me/2017/03/13/linter-v2-released.html).\n    ']);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var _coolTrim = require('cool-trim');

var _coolTrim2 = _interopRequireDefault(_coolTrim);

function greet() {
  return atom.notifications.addInfo('Welcome to Linter v2', {
    dismissable: true,
    description: (0, _coolTrim2['default'])(_templateObject)
  });
}

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9ncmVldGVyL2dyZWV0LXYyLXdlbGNvbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O3FCQUl3QixLQUFLOzs7Ozs7Ozt3QkFGUixXQUFXOzs7O0FBRWpCLFNBQVMsS0FBSyxHQUFHO0FBQzlCLFNBQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUU7QUFDeEQsZUFBVyxFQUFFLElBQUk7QUFDakIsZUFBVyw2Q0FTVjtHQUNGLENBQUMsQ0FBQTtDQUNIIiwiZmlsZSI6Ii9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyL2xpYi9ncmVldGVyL2dyZWV0LXYyLXdlbGNvbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgY29vbFRyaW0gZnJvbSAnY29vbC10cmltJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBncmVldCgpIHtcbiAgcmV0dXJuIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdXZWxjb21lIHRvIExpbnRlciB2MicsIHtcbiAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICBkZXNjcmlwdGlvbjogY29vbFRyaW1gXG4gICAgICBIaSBMaW50ZXIgdXNlciEg8J+Ri1xuXG4gICAgICBMaW50ZXIgaGFzIGJlZW4gdXBncmFkZWQgdG8gdjIuXG5cbiAgICAgIFBhY2thZ2VzIGNvbXBhdGlibGUgd2l0aCB2MSB3aWxsIGtlZXAgd29ya2luZyBvbiB2MiBmb3IgYSBsb25nIHRpbWUuXG4gICAgICBJZiB5b3UgYXJlIGEgcGFja2FnZSBhdXRob3IsIEkgZW5jb3VyYWdlIHlvdSB0byB1cGdyYWRlIHlvdXIgcGFja2FnZSB0byB0aGUgTGludGVyIHYyIEFQSS5cblxuICAgICAgWW91IGNhbiByZWFkIFt0aGUgYW5ub3VuY2VtZW50IHBvc3Qgb24gbXkgYmxvZ10oaHR0cDovL3N0ZWVsYnJhaW4ubWUvMjAxNy8wMy8xMy9saW50ZXItdjItcmVsZWFzZWQuaHRtbCkuXG4gICAgYCxcbiAgfSlcbn1cbiJdfQ==