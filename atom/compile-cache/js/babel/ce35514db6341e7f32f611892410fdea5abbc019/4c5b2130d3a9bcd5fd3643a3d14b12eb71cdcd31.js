Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atomTernjsEvents = require('./atom-ternjs-events');

var _atomTernjsEvents2 = _interopRequireDefault(_atomTernjsEvents);

var _atomTernjsManager = require('./atom-ternjs-manager');

var _atomTernjsManager2 = _interopRequireDefault(_atomTernjsManager);

var _atom = require('atom');

var _underscorePlus = require('underscore-plus');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomTernjsHelper = require('./atom-ternjs-helper');

var _servicesDebug = require('./services/debug');

var _servicesDebug2 = _interopRequireDefault(_servicesDebug);

'use babel';

var RenameView = require('./atom-ternjs-rename-view');

var Rename = (function () {
  function Rename() {
    _classCallCheck(this, Rename);

    this.disposables = [];

    this.renameView = null;
    this.renamePanel = null;

    this.hideListener = this.hide.bind(this);
  }

  _createClass(Rename, [{
    key: 'init',
    value: function init() {

      this.renameView = new RenameView();
      this.renameView.initialize(this);

      this.renamePanel = atom.workspace.addModalPanel({

        item: this.renameView,
        priority: 0,
        visible: false
      });

      atom.views.getView(this.renamePanel).classList.add('atom-ternjs-rename-panel', 'panel-bottom');

      _atomTernjsEvents2['default'].on('rename-hide', this.hideListener);

      this.registerCommands();
    }
  }, {
    key: 'registerCommands',
    value: function registerCommands() {

      this.disposables.push(atom.commands.add('atom-text-editor', 'atom-ternjs:rename', this.show.bind(this)));
    }
  }, {
    key: 'hide',
    value: function hide() {

      this.renamePanel && this.renamePanel.hide();

      (0, _atomTernjsHelper.focusEditor)();
    }
  }, {
    key: 'show',
    value: function show() {

      var codeEditor = atom.workspace.getActiveTextEditor();
      var currentNameRange = codeEditor.getLastCursor().getCurrentWordBufferRange({ includeNonWordCharacters: false });
      var currentName = codeEditor.getTextInBufferRange(currentNameRange);

      this.renameView.nameEditor.getModel().setText(currentName);
      this.renameView.nameEditor.getModel().selectAll();

      this.renamePanel.show();
      this.renameView.nameEditor.focus();
    }
  }, {
    key: 'updateAllAndRename',
    value: function updateAllAndRename(newName) {
      var _this = this;

      if (!_atomTernjsManager2['default'].client) {

        this.hide();

        return;
      }

      var idx = 0;
      var editors = atom.workspace.getTextEditors();

      for (var editor of editors) {

        if (!(0, _atomTernjsHelper.isValidEditor)(editor) || atom.project.relativizePath(editor.getURI())[0] !== _atomTernjsManager2['default'].client.projectDir) {

          idx++;

          continue;
        }

        _atomTernjsManager2['default'].client.update(editor).then(function (data) {

          if (++idx === editors.length) {

            var activeEditor = atom.workspace.getActiveTextEditor();
            var cursor = activeEditor.getLastCursor();

            if (!cursor) {

              return;
            }

            var position = cursor.getBufferPosition();

            _atomTernjsManager2['default'].client.rename(atom.project.relativizePath(activeEditor.getURI())[1], { line: position.row, ch: position.column }, newName).then(function (data) {

              if (!data) {

                return;
              }

              _this.rename(data);
            })['catch'](_servicesDebug2['default'].handleCatchWithNotification).then(_this.hideListener);
          }
        })['catch'](_servicesDebug2['default'].handleCatch).then(this.hideListener);
      }
    }
  }, {
    key: 'rename',
    value: function rename(data) {

      var dir = _atomTernjsManager2['default'].server.projectDir;

      if (!dir) {

        return;
      }

      var translateColumnBy = data.changes[0].text.length - data.name.length;

      for (var change of data.changes) {

        change.file = change.file.replace(/^.\//, '');
        change.file = _path2['default'].resolve(atom.project.relativizePath(dir)[0], change.file);
      }

      var changes = (0, _underscorePlus.uniq)(data.changes, function (item) {

        return JSON.stringify(item);
      });

      var currentFile = false;
      var arr = [];
      var idx = 0;

      for (var change of changes) {

        if (currentFile !== change.file) {

          currentFile = change.file;
          idx = arr.push([]) - 1;
        }

        arr[idx].push(change);
      }

      for (var arrObj of arr) {

        this.openFilesAndRename(arrObj, translateColumnBy);
      }

      this.hide();
    }
  }, {
    key: 'openFilesAndRename',
    value: function openFilesAndRename(obj, translateColumnBy) {
      var _this2 = this;

      atom.workspace.open(obj[0].file).then(function (textEditor) {

        var currentColumnOffset = 0;
        var idx = 0;
        var buffer = textEditor.getBuffer();
        var checkpoint = buffer.createCheckpoint();

        for (var change of obj) {

          _this2.setTextInRange(buffer, change, currentColumnOffset, idx === obj.length - 1, textEditor);
          currentColumnOffset += translateColumnBy;

          idx++;
        }

        buffer.groupChangesSinceCheckpoint(checkpoint);
      });
    }
  }, {
    key: 'setTextInRange',
    value: function setTextInRange(buffer, change, offset, moveCursor, textEditor) {

      change.start += offset;
      change.end += offset;
      var position = buffer.positionForCharacterIndex(change.start);
      length = change.end - change.start;
      var end = position.translate(new _atom.Point(0, length));
      var range = new _atom.Range(position, end);
      buffer.setTextInRange(range, change.text);

      if (!moveCursor) {

        return;
      }

      var cursor = textEditor.getLastCursor();

      cursor && cursor.setBufferPosition(position);
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      (0, _atomTernjsHelper.disposeAll)(this.disposables);
      this.disposables = [];

      _atomTernjsEvents2['default'].off('rename-hide', this.hideListener);

      this.renameView && this.renameView.destroy();
      this.renameView = null;

      this.renamePanel && this.renamePanel.destroy();
      this.renamePanel = null;
    }
  }]);

  return Rename;
})();

exports['default'] = new Rename();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoLy5hdG9tL3BhY2thZ2VzL2F0b20tdGVybmpzL2xpYi9hdG9tLXRlcm5qcy1yZW5hbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztnQ0FJb0Isc0JBQXNCOzs7O2lDQUN0Qix1QkFBdUI7Ozs7b0JBSXBDLE1BQU07OzhCQUNNLGlCQUFpQjs7b0JBQ25CLE1BQU07Ozs7Z0NBS2hCLHNCQUFzQjs7NkJBQ1gsa0JBQWtCOzs7O0FBakJwQyxXQUFXLENBQUM7O0FBRVosSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7O0lBaUJsRCxNQUFNO0FBRUMsV0FGUCxNQUFNLEdBRUk7MEJBRlYsTUFBTTs7QUFJUixRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsUUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7O0FBRXhCLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDMUM7O2VBVkcsTUFBTTs7V0FZTixnQkFBRzs7QUFFTCxVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7QUFDbkMsVUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRWpDLFVBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7O0FBRTlDLFlBQUksRUFBRSxJQUFJLENBQUMsVUFBVTtBQUNyQixnQkFBUSxFQUFFLENBQUM7QUFDWCxlQUFPLEVBQUUsS0FBSztPQUNmLENBQUMsQ0FBQzs7QUFFSCxVQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxjQUFjLENBQUMsQ0FBQzs7QUFFL0Ysb0NBQVEsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7O0FBRTdDLFVBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ3pCOzs7V0FFZSw0QkFBRzs7QUFFakIsVUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFHOzs7V0FFRyxnQkFBRzs7QUFFTCxVQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRTVDLDBDQUFhLENBQUM7S0FDZjs7O1dBRUcsZ0JBQUc7O0FBRUwsVUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3hELFVBQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLHlCQUF5QixDQUFDLEVBQUMsd0JBQXdCLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUNqSCxVQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFdEUsVUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzNELFVBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVsRCxVQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3hCLFVBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ3BDOzs7V0FFaUIsNEJBQUMsT0FBTyxFQUFFOzs7QUFFMUIsVUFBSSxDQUFDLCtCQUFRLE1BQU0sRUFBRTs7QUFFbkIsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFDOztBQUVaLGVBQU87T0FDUjs7QUFFRCxVQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDWixVQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUVoRCxXQUFLLElBQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTs7QUFFNUIsWUFDRSxDQUFDLHFDQUFjLE1BQU0sQ0FBQyxJQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSywrQkFBUSxNQUFNLENBQUMsVUFBVSxFQUM3RTs7QUFFQSxhQUFHLEVBQUUsQ0FBQzs7QUFFTixtQkFBUztTQUNWOztBQUVELHVDQUFRLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQzFCLElBQUksQ0FBQyxVQUFDLElBQUksRUFBSzs7QUFFZCxjQUFJLEVBQUUsR0FBRyxLQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7O0FBRTVCLGdCQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDMUQsZ0JBQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7QUFFNUMsZ0JBQUksQ0FBQyxNQUFNLEVBQUU7O0FBRVgscUJBQU87YUFDUjs7QUFFRCxnQkFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7O0FBRTVDLDJDQUFRLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUksRUFBSzs7QUFFOUksa0JBQUksQ0FBQyxJQUFJLEVBQUU7O0FBRVQsdUJBQU87ZUFDUjs7QUFFRCxvQkFBSyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbkIsQ0FBQyxTQUNJLENBQUMsMkJBQU0sMkJBQTJCLENBQUMsQ0FDeEMsSUFBSSxDQUFDLE1BQUssWUFBWSxDQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDLFNBQ0ksQ0FBQywyQkFBTSxXQUFXLENBQUMsQ0FDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztPQUM1QjtLQUNGOzs7V0FFSyxnQkFBQyxJQUFJLEVBQUU7O0FBRVgsVUFBTSxHQUFHLEdBQUcsK0JBQVEsTUFBTSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsVUFBSSxDQUFDLEdBQUcsRUFBRTs7QUFFUixlQUFPO09BQ1I7O0FBRUQsVUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7O0FBRXpFLFdBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTs7QUFFL0IsY0FBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDOUMsY0FBTSxDQUFDLElBQUksR0FBRyxrQkFBSyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQzlFOztBQUVELFVBQUksT0FBTyxHQUFHLDBCQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBQyxJQUFJLEVBQUs7O0FBRXpDLGVBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM3QixDQUFDLENBQUM7O0FBRUgsVUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLFVBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNiLFVBQUksR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFWixXQUFLLElBQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTs7QUFFNUIsWUFBSSxXQUFXLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRTs7QUFFL0IscUJBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQzFCLGFBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN4Qjs7QUFFRCxXQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ3ZCOztBQUVELFdBQUssSUFBTSxNQUFNLElBQUksR0FBRyxFQUFFOztBQUV4QixZQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7T0FDcEQ7O0FBRUQsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2I7OztXQUVpQiw0QkFBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7OztBQUV6QyxVQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsVUFBVSxFQUFLOztBQUVwRCxZQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQztBQUM1QixZQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDWixZQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDdEMsWUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRTdDLGFBQUssSUFBTSxNQUFNLElBQUksR0FBRyxFQUFFOztBQUV4QixpQkFBSyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxHQUFHLEtBQUssR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0YsNkJBQW1CLElBQUksaUJBQWlCLENBQUM7O0FBRXpDLGFBQUcsRUFBRSxDQUFDO1NBQ1A7O0FBRUQsY0FBTSxDQUFDLDJCQUEyQixDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQ2hELENBQUMsQ0FBQztLQUNKOzs7V0FFYSx3QkFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFOztBQUU3RCxZQUFNLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQztBQUN2QixZQUFNLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQztBQUNyQixVQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hFLFlBQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDbkMsVUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxnQkFBVSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNyRCxVQUFNLEtBQUssR0FBRyxnQkFBVSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdkMsWUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUUxQyxVQUFJLENBQUMsVUFBVSxFQUFFOztBQUVmLGVBQU87T0FDUjs7QUFFRCxVQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUM7O0FBRTFDLFlBQU0sSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDOUM7OztXQUVNLG1CQUFHOztBQUVSLHdDQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3QixVQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQzs7QUFFdEIsb0NBQVEsR0FBRyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7O0FBRTlDLFVBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM3QyxVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs7QUFFdkIsVUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9DLFVBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0tBQ3pCOzs7U0FuTkcsTUFBTTs7O3FCQXNORyxJQUFJLE1BQU0sRUFBRSIsImZpbGUiOiIvVXNlcnMvam9zaC8uYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvYXRvbS10ZXJuanMtcmVuYW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmNvbnN0IFJlbmFtZVZpZXcgPSByZXF1aXJlKCcuL2F0b20tdGVybmpzLXJlbmFtZS12aWV3Jyk7XG5cbmltcG9ydCBlbWl0dGVyIGZyb20gJy4vYXRvbS10ZXJuanMtZXZlbnRzJztcbmltcG9ydCBtYW5hZ2VyIGZyb20gJy4vYXRvbS10ZXJuanMtbWFuYWdlcic7XG5pbXBvcnQge1xuICBQb2ludCxcbiAgUmFuZ2Vcbn0gZnJvbSAnYXRvbSc7XG5pbXBvcnQge3VuaXF9IGZyb20gJ3VuZGVyc2NvcmUtcGx1cyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7XG4gIGRpc3Bvc2VBbGwsXG4gIGZvY3VzRWRpdG9yLFxuICBpc1ZhbGlkRWRpdG9yXG59IGZyb20gJy4vYXRvbS10ZXJuanMtaGVscGVyJztcbmltcG9ydCBkZWJ1ZyBmcm9tICcuL3NlcnZpY2VzL2RlYnVnJztcblxuY2xhc3MgUmVuYW1lIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBbXTtcblxuICAgIHRoaXMucmVuYW1lVmlldyA9IG51bGw7XG4gICAgdGhpcy5yZW5hbWVQYW5lbCA9IG51bGw7XG5cbiAgICB0aGlzLmhpZGVMaXN0ZW5lciA9IHRoaXMuaGlkZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgaW5pdCgpIHtcblxuICAgIHRoaXMucmVuYW1lVmlldyA9IG5ldyBSZW5hbWVWaWV3KCk7XG4gICAgdGhpcy5yZW5hbWVWaWV3LmluaXRpYWxpemUodGhpcyk7XG5cbiAgICB0aGlzLnJlbmFtZVBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG5cbiAgICAgIGl0ZW06IHRoaXMucmVuYW1lVmlldyxcbiAgICAgIHByaW9yaXR5OiAwLFxuICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICB9KTtcblxuICAgIGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLnJlbmFtZVBhbmVsKS5jbGFzc0xpc3QuYWRkKCdhdG9tLXRlcm5qcy1yZW5hbWUtcGFuZWwnLCAncGFuZWwtYm90dG9tJyk7XG5cbiAgICBlbWl0dGVyLm9uKCdyZW5hbWUtaGlkZScsIHRoaXMuaGlkZUxpc3RlbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJDb21tYW5kcygpO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kcygpIHtcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMucHVzaChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdhdG9tLXRlcm5qczpyZW5hbWUnLCB0aGlzLnNob3cuYmluZCh0aGlzKSkpO1xuICB9XG5cbiAgaGlkZSgpIHtcblxuICAgIHRoaXMucmVuYW1lUGFuZWwgJiYgdGhpcy5yZW5hbWVQYW5lbC5oaWRlKCk7XG5cbiAgICBmb2N1c0VkaXRvcigpO1xuICB9XG5cbiAgc2hvdygpIHtcblxuICAgIGNvbnN0IGNvZGVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgY29uc3QgY3VycmVudE5hbWVSYW5nZSA9IGNvZGVFZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2Uoe2luY2x1ZGVOb25Xb3JkQ2hhcmFjdGVyczogZmFsc2V9KTtcbiAgICBjb25zdCBjdXJyZW50TmFtZSA9IGNvZGVFZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoY3VycmVudE5hbWVSYW5nZSk7XG5cbiAgICB0aGlzLnJlbmFtZVZpZXcubmFtZUVkaXRvci5nZXRNb2RlbCgpLnNldFRleHQoY3VycmVudE5hbWUpO1xuICAgIHRoaXMucmVuYW1lVmlldy5uYW1lRWRpdG9yLmdldE1vZGVsKCkuc2VsZWN0QWxsKCk7XG5cbiAgICB0aGlzLnJlbmFtZVBhbmVsLnNob3coKTtcbiAgICB0aGlzLnJlbmFtZVZpZXcubmFtZUVkaXRvci5mb2N1cygpO1xuICB9XG5cbiAgdXBkYXRlQWxsQW5kUmVuYW1lKG5ld05hbWUpIHtcblxuICAgIGlmICghbWFuYWdlci5jbGllbnQpIHtcblxuICAgICAgdGhpcy5oaWRlKCk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgaWR4ID0gMDtcbiAgICBjb25zdCBlZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKTtcblxuICAgIGZvciAoY29uc3QgZWRpdG9yIG9mIGVkaXRvcnMpIHtcblxuICAgICAgaWYgKFxuICAgICAgICAhaXNWYWxpZEVkaXRvcihlZGl0b3IpIHx8XG4gICAgICAgIGF0b20ucHJvamVjdC5yZWxhdGl2aXplUGF0aChlZGl0b3IuZ2V0VVJJKCkpWzBdICE9PSBtYW5hZ2VyLmNsaWVudC5wcm9qZWN0RGlyXG4gICAgICApIHtcblxuICAgICAgICBpZHgrKztcblxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgbWFuYWdlci5jbGllbnQudXBkYXRlKGVkaXRvcilcbiAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICAgIGlmICgrK2lkeCA9PT0gZWRpdG9ycy5sZW5ndGgpIHtcblxuICAgICAgICAgICAgY29uc3QgYWN0aXZlRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYWN0aXZlRWRpdG9yLmdldExhc3RDdXJzb3IoKTtcblxuICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcblxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICAgICAgICAgIG1hbmFnZXIuY2xpZW50LnJlbmFtZShhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoYWN0aXZlRWRpdG9yLmdldFVSSSgpKVsxXSwge2xpbmU6IHBvc2l0aW9uLnJvdywgY2g6IHBvc2l0aW9uLmNvbHVtbn0sIG5ld05hbWUpLnRoZW4oKGRhdGEpID0+IHtcblxuICAgICAgICAgICAgICBpZiAoIWRhdGEpIHtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMucmVuYW1lKGRhdGEpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChkZWJ1Zy5oYW5kbGVDYXRjaFdpdGhOb3RpZmljYXRpb24pXG4gICAgICAgICAgICAudGhlbih0aGlzLmhpZGVMaXN0ZW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZGVidWcuaGFuZGxlQ2F0Y2gpXG4gICAgICAgIC50aGVuKHRoaXMuaGlkZUxpc3RlbmVyKTtcbiAgICB9XG4gIH1cblxuICByZW5hbWUoZGF0YSkge1xuXG4gICAgY29uc3QgZGlyID0gbWFuYWdlci5zZXJ2ZXIucHJvamVjdERpcjtcblxuICAgIGlmICghZGlyKSB7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2xhdGVDb2x1bW5CeSA9IGRhdGEuY2hhbmdlc1swXS50ZXh0Lmxlbmd0aCAtIGRhdGEubmFtZS5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBjaGFuZ2Ugb2YgZGF0YS5jaGFuZ2VzKSB7XG5cbiAgICAgIGNoYW5nZS5maWxlID0gY2hhbmdlLmZpbGUucmVwbGFjZSgvXi5cXC8vLCAnJyk7XG4gICAgICBjaGFuZ2UuZmlsZSA9IHBhdGgucmVzb2x2ZShhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZGlyKVswXSwgY2hhbmdlLmZpbGUpO1xuICAgIH1cblxuICAgIGxldCBjaGFuZ2VzID0gdW5pcShkYXRhLmNoYW5nZXMsIChpdGVtKSA9PiB7XG5cbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShpdGVtKTtcbiAgICB9KTtcblxuICAgIGxldCBjdXJyZW50RmlsZSA9IGZhbHNlO1xuICAgIGxldCBhcnIgPSBbXTtcbiAgICBsZXQgaWR4ID0gMDtcblxuICAgIGZvciAoY29uc3QgY2hhbmdlIG9mIGNoYW5nZXMpIHtcblxuICAgICAgaWYgKGN1cnJlbnRGaWxlICE9PSBjaGFuZ2UuZmlsZSkge1xuXG4gICAgICAgIGN1cnJlbnRGaWxlID0gY2hhbmdlLmZpbGU7XG4gICAgICAgIGlkeCA9IGFyci5wdXNoKFtdKSAtIDE7XG4gICAgICB9XG5cbiAgICAgIGFycltpZHhdLnB1c2goY2hhbmdlKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGFyck9iaiBvZiBhcnIpIHtcblxuICAgICAgdGhpcy5vcGVuRmlsZXNBbmRSZW5hbWUoYXJyT2JqLCB0cmFuc2xhdGVDb2x1bW5CeSk7XG4gICAgfVxuXG4gICAgdGhpcy5oaWRlKCk7XG4gIH1cblxuICBvcGVuRmlsZXNBbmRSZW5hbWUob2JqLCB0cmFuc2xhdGVDb2x1bW5CeSkge1xuXG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihvYmpbMF0uZmlsZSkudGhlbigodGV4dEVkaXRvcikgPT4ge1xuXG4gICAgICBsZXQgY3VycmVudENvbHVtbk9mZnNldCA9IDA7XG4gICAgICBsZXQgaWR4ID0gMDtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IHRleHRFZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICBjb25zdCBjaGVja3BvaW50ID0gYnVmZmVyLmNyZWF0ZUNoZWNrcG9pbnQoKTtcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2Ugb2Ygb2JqKSB7XG5cbiAgICAgICAgdGhpcy5zZXRUZXh0SW5SYW5nZShidWZmZXIsIGNoYW5nZSwgY3VycmVudENvbHVtbk9mZnNldCwgaWR4ID09PSBvYmoubGVuZ3RoIC0gMSwgdGV4dEVkaXRvcik7XG4gICAgICAgIGN1cnJlbnRDb2x1bW5PZmZzZXQgKz0gdHJhbnNsYXRlQ29sdW1uQnk7XG5cbiAgICAgICAgaWR4Kys7XG4gICAgICB9XG5cbiAgICAgIGJ1ZmZlci5ncm91cENoYW5nZXNTaW5jZUNoZWNrcG9pbnQoY2hlY2twb2ludCk7XG4gICAgfSk7XG4gIH1cblxuICBzZXRUZXh0SW5SYW5nZShidWZmZXIsIGNoYW5nZSwgb2Zmc2V0LCBtb3ZlQ3Vyc29yLCB0ZXh0RWRpdG9yKSB7XG5cbiAgICBjaGFuZ2Uuc3RhcnQgKz0gb2Zmc2V0O1xuICAgIGNoYW5nZS5lbmQgKz0gb2Zmc2V0O1xuICAgIGNvbnN0IHBvc2l0aW9uID0gYnVmZmVyLnBvc2l0aW9uRm9yQ2hhcmFjdGVySW5kZXgoY2hhbmdlLnN0YXJ0KTtcbiAgICBsZW5ndGggPSBjaGFuZ2UuZW5kIC0gY2hhbmdlLnN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHBvc2l0aW9uLnRyYW5zbGF0ZShuZXcgUG9pbnQoMCwgbGVuZ3RoKSk7XG4gICAgY29uc3QgcmFuZ2UgPSBuZXcgUmFuZ2UocG9zaXRpb24sIGVuZCk7XG4gICAgYnVmZmVyLnNldFRleHRJblJhbmdlKHJhbmdlLCBjaGFuZ2UudGV4dCk7XG5cbiAgICBpZiAoIW1vdmVDdXJzb3IpIHtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvciA9IHRleHRFZGl0b3IuZ2V0TGFzdEN1cnNvcigpO1xuXG4gICAgY3Vyc29yICYmIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb3NpdGlvbik7XG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gICAgZGlzcG9zZUFsbCh0aGlzLmRpc3Bvc2FibGVzKTtcbiAgICB0aGlzLmRpc3Bvc2FibGVzID0gW107XG5cbiAgICBlbWl0dGVyLm9mZigncmVuYW1lLWhpZGUnLCB0aGlzLmhpZGVMaXN0ZW5lcik7XG5cbiAgICB0aGlzLnJlbmFtZVZpZXcgJiYgdGhpcy5yZW5hbWVWaWV3LmRlc3Ryb3koKTtcbiAgICB0aGlzLnJlbmFtZVZpZXcgPSBudWxsO1xuXG4gICAgdGhpcy5yZW5hbWVQYW5lbCAmJiB0aGlzLnJlbmFtZVBhbmVsLmRlc3Ryb3koKTtcbiAgICB0aGlzLnJlbmFtZVBhbmVsID0gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgUmVuYW1lKCk7XG4iXX0=