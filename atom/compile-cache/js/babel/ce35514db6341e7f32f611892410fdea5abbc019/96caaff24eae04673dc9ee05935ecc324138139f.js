var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('../helpers');

var PanelDelegate = (function () {
  function PanelDelegate() {
    var _this = this;

    _classCallCheck(this, PanelDelegate);

    this.emitter = new _atom.Emitter();
    this.messages = [];
    this.filteredMessages = [];
    this.subscriptions = new _atom.CompositeDisposable();

    this.subscriptions.add(atom.config.observe('linter-ui-default.panelRepresents', function (panelRepresents) {
      var notInitial = typeof _this.panelRepresents !== 'undefined';
      _this.panelRepresents = panelRepresents;
      if (notInitial) {
        _this.update();
      }
    }));
    var changeSubscription = undefined;
    this.subscriptions.add(atom.workspace.getCenter().observeActivePaneItem(function () {
      if (changeSubscription) {
        changeSubscription.dispose();
        changeSubscription = null;
      }
      var textEditor = (0, _helpers.getActiveTextEditor)();
      if (textEditor) {
        (function () {
          if (_this.panelRepresents !== 'Entire Project') {
            _this.update();
          }
          var oldRow = -1;
          changeSubscription = textEditor.onDidChangeCursorPosition(function (_ref) {
            var newBufferPosition = _ref.newBufferPosition;

            if (oldRow !== newBufferPosition.row && _this.panelRepresents === 'Current Line') {
              oldRow = newBufferPosition.row;
              _this.update();
            }
          });
        })();
      }

      if (_this.panelRepresents !== 'Entire Project' || textEditor) {
        _this.update();
      }
    }));
    this.subscriptions.add(new _atom.Disposable(function () {
      if (changeSubscription) {
        changeSubscription.dispose();
      }
    }));
  }

  _createClass(PanelDelegate, [{
    key: 'getFilteredMessages',
    value: function getFilteredMessages() {
      var filteredMessages = [];
      if (this.panelRepresents === 'Entire Project') {
        filteredMessages = this.messages;
      } else if (this.panelRepresents === 'Current File') {
        var activeEditor = (0, _helpers.getActiveTextEditor)();
        if (!activeEditor) return [];
        filteredMessages = (0, _helpers.filterMessages)(this.messages, activeEditor.getPath());
      } else if (this.panelRepresents === 'Current Line') {
        var activeEditor = (0, _helpers.getActiveTextEditor)();
        if (!activeEditor) return [];
        var activeLine = activeEditor.getCursors()[0].getBufferRow();
        filteredMessages = (0, _helpers.filterMessagesByRangeOrPoint)(this.messages, activeEditor.getPath(), _atom.Range.fromObject([[activeLine, 0], [activeLine, Infinity]]));
      }
      return filteredMessages;
    }
  }, {
    key: 'update',
    value: function update() {
      var messages = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (Array.isArray(messages)) {
        this.messages = messages;
      }
      this.filteredMessages = this.getFilteredMessages();
      this.emitter.emit('observe-messages', this.filteredMessages);
    }
  }, {
    key: 'onDidChangeMessages',
    value: function onDidChangeMessages(callback) {
      return this.emitter.on('observe-messages', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
    }
  }]);

  return PanelDelegate;
})();

module.exports = PanelDelegate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2RlbGVnYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7b0JBRWdFLE1BQU07O3VCQUNZLFlBQVk7O0lBR3hGLGFBQWE7QUFPTixXQVBQLGFBQWEsR0FPSDs7OzBCQVBWLGFBQWE7O0FBUWYsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUE7QUFDMUIsUUFBSSxDQUFDLGFBQWEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG1DQUFtQyxFQUFFLFVBQUEsZUFBZSxFQUFJO0FBQzFFLFVBQU0sVUFBVSxHQUFHLE9BQU8sTUFBSyxlQUFlLEtBQUssV0FBVyxDQUFBO0FBQzlELFlBQUssZUFBZSxHQUFHLGVBQWUsQ0FBQTtBQUN0QyxVQUFJLFVBQVUsRUFBRTtBQUNkLGNBQUssTUFBTSxFQUFFLENBQUE7T0FDZDtLQUNGLENBQUMsQ0FDSCxDQUFBO0FBQ0QsUUFBSSxrQkFBa0IsWUFBQSxDQUFBO0FBQ3RCLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLFlBQU07QUFDckQsVUFBSSxrQkFBa0IsRUFBRTtBQUN0QiwwQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUM1QiwwQkFBa0IsR0FBRyxJQUFJLENBQUE7T0FDMUI7QUFDRCxVQUFNLFVBQVUsR0FBRyxtQ0FBcUIsQ0FBQTtBQUN4QyxVQUFJLFVBQVUsRUFBRTs7QUFDZCxjQUFJLE1BQUssZUFBZSxLQUFLLGdCQUFnQixFQUFFO0FBQzdDLGtC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dWktZGVmYXVsdC9saWIvcGFuZWwvZGVsZWdhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBFbWl0dGVyLCBSYW5nZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBnZXRBY3RpdmVUZXh0RWRpdG9yLCBmaWx0ZXJNZXNzYWdlcywgZmlsdGVyTWVzc2FnZXNCeVJhbmdlT3JQb2ludCB9IGZyb20gJy4uL2hlbHBlcnMnXG5pbXBvcnQgdHlwZSB7IExpbnRlck1lc3NhZ2UgfSBmcm9tICcuLi90eXBlcydcblxuY2xhc3MgUGFuZWxEZWxlZ2F0ZSB7XG4gIGVtaXR0ZXI6IEVtaXR0ZXJcbiAgbWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+XG4gIGZpbHRlcmVkTWVzc2FnZXM6IEFycmF5PExpbnRlck1lc3NhZ2U+XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcGFuZWxSZXByZXNlbnRzOiAnRW50aXJlIFByb2plY3QnIHwgJ0N1cnJlbnQgRmlsZScgfCAnQ3VycmVudCBMaW5lJ1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLm1lc3NhZ2VzID0gW11cbiAgICB0aGlzLmZpbHRlcmVkTWVzc2FnZXMgPSBbXVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5wYW5lbFJlcHJlc2VudHMnLCBwYW5lbFJlcHJlc2VudHMgPT4ge1xuICAgICAgICBjb25zdCBub3RJbml0aWFsID0gdHlwZW9mIHRoaXMucGFuZWxSZXByZXNlbnRzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICB0aGlzLnBhbmVsUmVwcmVzZW50cyA9IHBhbmVsUmVwcmVzZW50c1xuICAgICAgICBpZiAobm90SW5pdGlhbCkge1xuICAgICAgICAgIHRoaXMudXBkYXRlKClcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuICAgIGxldCBjaGFuZ2VTdWJzY3JpcHRpb25cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0Q2VudGVyKCkub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKCgpID0+IHtcbiAgICAgICAgaWYgKGNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgICAgIGNoYW5nZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICAgICAgICBjaGFuZ2VTdWJzY3JpcHRpb24gPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dEVkaXRvciA9IGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgICBpZiAodGV4dEVkaXRvcikge1xuICAgICAgICAgIGlmICh0aGlzLnBhbmVsUmVwcmVzZW50cyAhPT0gJ0VudGlyZSBQcm9qZWN0Jykge1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgb2xkUm93ID0gLTFcbiAgICAgICAgICBjaGFuZ2VTdWJzY3JpcHRpb24gPSB0ZXh0RWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oKHsgbmV3QnVmZmVyUG9zaXRpb24gfSkgPT4ge1xuICAgICAgICAgICAgaWYgKG9sZFJvdyAhPT0gbmV3QnVmZmVyUG9zaXRpb24ucm93ICYmIHRoaXMucGFuZWxSZXByZXNlbnRzID09PSAnQ3VycmVudCBMaW5lJykge1xuICAgICAgICAgICAgICBvbGRSb3cgPSBuZXdCdWZmZXJQb3NpdGlvbi5yb3dcbiAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYW5lbFJlcHJlc2VudHMgIT09ICdFbnRpcmUgUHJvamVjdCcgfHwgdGV4dEVkaXRvcikge1xuICAgICAgICAgIHRoaXMudXBkYXRlKClcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBuZXcgRGlzcG9zYWJsZShmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGNoYW5nZVN1YnNjcmlwdGlvbikge1xuICAgICAgICAgIGNoYW5nZVN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKVxuICB9XG4gIGdldEZpbHRlcmVkTWVzc2FnZXMoKTogQXJyYXk8TGludGVyTWVzc2FnZT4ge1xuICAgIGxldCBmaWx0ZXJlZE1lc3NhZ2VzID0gW11cbiAgICBpZiAodGhpcy5wYW5lbFJlcHJlc2VudHMgPT09ICdFbnRpcmUgUHJvamVjdCcpIHtcbiAgICAgIGZpbHRlcmVkTWVzc2FnZXMgPSB0aGlzLm1lc3NhZ2VzXG4gICAgfSBlbHNlIGlmICh0aGlzLnBhbmVsUmVwcmVzZW50cyA9PT0gJ0N1cnJlbnQgRmlsZScpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZUVkaXRvciA9IGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgaWYgKCFhY3RpdmVFZGl0b3IpIHJldHVybiBbXVxuICAgICAgZmlsdGVyZWRNZXNzYWdlcyA9IGZpbHRlck1lc3NhZ2VzKHRoaXMubWVzc2FnZXMsIGFjdGl2ZUVkaXRvci5nZXRQYXRoKCkpXG4gICAgfSBlbHNlIGlmICh0aGlzLnBhbmVsUmVwcmVzZW50cyA9PT0gJ0N1cnJlbnQgTGluZScpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZUVkaXRvciA9IGdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgaWYgKCFhY3RpdmVFZGl0b3IpIHJldHVybiBbXVxuICAgICAgY29uc3QgYWN0aXZlTGluZSA9IGFjdGl2ZUVkaXRvci5nZXRDdXJzb3JzKClbMF0uZ2V0QnVmZmVyUm93KClcbiAgICAgIGZpbHRlcmVkTWVzc2FnZXMgPSBmaWx0ZXJNZXNzYWdlc0J5UmFuZ2VPclBvaW50KFxuICAgICAgICB0aGlzLm1lc3NhZ2VzLFxuICAgICAgICBhY3RpdmVFZGl0b3IuZ2V0UGF0aCgpLFxuICAgICAgICBSYW5nZS5mcm9tT2JqZWN0KFtbYWN0aXZlTGluZSwgMF0sIFthY3RpdmVMaW5lLCBJbmZpbml0eV1dKSxcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlcmVkTWVzc2FnZXNcbiAgfVxuICB1cGRhdGUobWVzc2FnZXM6ID9BcnJheTxMaW50ZXJNZXNzYWdlPiA9IG51bGwpOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlcykpIHtcbiAgICAgIHRoaXMubWVzc2FnZXMgPSBtZXNzYWdlc1xuICAgIH1cbiAgICB0aGlzLmZpbHRlcmVkTWVzc2FnZXMgPSB0aGlzLmdldEZpbHRlcmVkTWVzc2FnZXMoKVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdvYnNlcnZlLW1lc3NhZ2VzJywgdGhpcy5maWx0ZXJlZE1lc3NhZ2VzKVxuICB9XG4gIG9uRGlkQ2hhbmdlTWVzc2FnZXMoY2FsbGJhY2s6IChtZXNzYWdlczogQXJyYXk8TGludGVyTWVzc2FnZT4pID0+IGFueSk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ29ic2VydmUtbWVzc2FnZXMnLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsRGVsZWdhdGVcbiJdfQ==