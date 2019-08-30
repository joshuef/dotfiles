var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('../helpers');

var React = undefined;
var ReactDOM = undefined;
var Component = undefined;

var PanelDock = (function () {
  function PanelDock(delegate) {
    var _this = this;

    _classCallCheck(this, PanelDock);

    this.element = document.createElement('div');
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', function (panelHeight) {
      var paneContainer = atom.workspace.paneContainerForItem(_this);
      // NOTE: This is an internal API access
      // It's necessary because there's no Public API for it yet
      if (paneContainer && typeof paneContainer.state.size === 'number' && typeof paneContainer.render === 'function') {
        paneContainer.state.size = panelHeight;
        paneContainer.render(paneContainer.state);
      }
    }));

    if (!React) {
      React = require('react');
    }
    if (!ReactDOM) {
      ReactDOM = require('react-dom');
    }
    if (!Component) {
      Component = require('./component');
    }

    ReactDOM.render(React.createElement(Component, { delegate: delegate }), this.element);
  }

  _createClass(PanelDock, [{
    key: 'getURI',
    value: function getURI() {
      return _helpers.WORKSPACE_URI;
    }
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return 'Linter';
    }
  }, {
    key: 'getDefaultLocation',
    value: function getDefaultLocation() {
      return 'bottom';
    }
  }, {
    key: 'getAllowedLocations',
    value: function getAllowedLocations() {
      return ['center', 'bottom', 'top'];
    }
  }, {
    key: 'getPreferredHeight',
    value: function getPreferredHeight() {
      return atom.config.get('linter-ui-default.panelHeight');
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      var parentElement = this.element.parentElement;
      if (parentElement) {
        var _parentElement$getBoundingClientRect = parentElement.getBoundingClientRect();

        var height = _parentElement$getBoundingClientRect.height;

        if (height > 0) {
          atom.config.set('linter-ui-default.panelHeight', height);
        }
      }

      this.subscriptions.dispose();
      var paneContainer = atom.workspace.paneContainerForItem(this);
      if (paneContainer) {
        paneContainer.paneForItem(this).destroyItem(this, true);
      }
    }
  }]);

  return PanelDock;
})();

module.exports = PanelDock;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2RvY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztvQkFFb0MsTUFBTTs7dUJBQ1osWUFBWTs7QUFFMUMsSUFBSSxLQUFLLFlBQUEsQ0FBQTtBQUNULElBQUksUUFBUSxZQUFBLENBQUE7QUFDWixJQUFJLFNBQVMsWUFBQSxDQUFBOztJQUVQLFNBQVM7QUFJRixXQUpQLFNBQVMsQ0FJRCxRQUFnQixFQUFFOzs7MEJBSjFCLFNBQVM7O0FBS1gsUUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVDLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsK0JBQStCLEVBQUUsVUFBQyxXQUFXLEVBQUs7QUFDM0YsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsT0FBTSxDQUFBOzs7QUFHL0QsVUFBSSxhQUFhLElBQUksT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksT0FBTyxhQUFhLENBQUMsTUFBTSxLQUFLLFVBQVUsRUFBRTtBQUMvRyxxQkFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFBO0FBQ3RDLHFCQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtPQUMxQztLQUNGLENBQUMsQ0FBQyxDQUFBOztBQUVILFFBQUksQ0FBQyxLQUFLLEVBQUU7QUFDVixXQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0tBQ3pCO0FBQ0QsUUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNiLGNBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7S0FDaEM7QUFDRCxRQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2QsZUFBUyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtLQUNuQzs7QUFFRCxZQUFRLENBQUMsTUFBTSxDQUFDLG9CQUFDLFNBQVMsSUFBQyxRQUFRLEVBQUUsUUFBUSxBQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7R0FDakU7O2VBNUJHLFNBQVM7O1dBNkJQLGtCQUFHO0FBQ1Asb0NBQW9CO0tBQ3JCOzs7V0FDTyxvQkFBRztBQUNULGFBQU8sUUFBUSxDQUFBO0tBQ2hCOzs7V0FDaUIsOEJBQUc7QUFDbkIsYUFBTyxRQUFRLENBQUE7S0FDaEI7OztXQUNrQiwrQkFBRztBQUNwQixhQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUNuQzs7O1dBQ2lCLDhCQUFHO0FBQ25CLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQTtLQUN4RDs7O1dBQ00sbUJBQUc7QUFDUixVQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQTtBQUNoRCxVQUFJLGFBQWEsRUFBRTttREFDRSxhQUFhLENBQUMscUJBQXFCLEVBQUU7O1lBQWhELE1BQU0sd0NBQU4sTUFBTTs7QUFDZCxZQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDZCxjQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQTtTQUN6RDtPQUNGOztBQUVELFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDNUIsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUMvRCxVQUFJLGFBQWEsRUFBRTtBQUNqQixxQkFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO09BQ3hEO0tBQ0Y7OztTQTFERyxTQUFTOzs7QUE2RGYsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUEiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9saW50ZXItdWktZGVmYXVsdC9saWIvcGFuZWwvZG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEBmbG93ICovXG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgV09SS1NQQUNFX1VSSSB9IGZyb20gJy4uL2hlbHBlcnMnXG5cbmxldCBSZWFjdFxubGV0IFJlYWN0RE9NXG5sZXQgQ29tcG9uZW50XG5cbmNsYXNzIFBhbmVsRG9jayB7XG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKGRlbGVnYXRlOiBPYmplY3QpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0LnBhbmVsSGVpZ2h0JywgKHBhbmVsSGVpZ2h0KSA9PiB7XG4gICAgICBjb25zdCBwYW5lQ29udGFpbmVyID0gYXRvbS53b3Jrc3BhY2UucGFuZUNvbnRhaW5lckZvckl0ZW0odGhpcylcbiAgICAgIC8vIE5PVEU6IFRoaXMgaXMgYW4gaW50ZXJuYWwgQVBJIGFjY2Vzc1xuICAgICAgLy8gSXQncyBuZWNlc3NhcnkgYmVjYXVzZSB0aGVyZSdzIG5vIFB1YmxpYyBBUEkgZm9yIGl0IHlldFxuICAgICAgaWYgKHBhbmVDb250YWluZXIgJiYgdHlwZW9mIHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIHBhbmVDb250YWluZXIucmVuZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZSA9IHBhbmVsSGVpZ2h0XG4gICAgICAgIHBhbmVDb250YWluZXIucmVuZGVyKHBhbmVDb250YWluZXIuc3RhdGUpXG4gICAgICB9XG4gICAgfSkpXG5cbiAgICBpZiAoIVJlYWN0KSB7XG4gICAgICBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0JylcbiAgICB9XG4gICAgaWYgKCFSZWFjdERPTSkge1xuICAgICAgUmVhY3RET00gPSByZXF1aXJlKCdyZWFjdC1kb20nKVxuICAgIH1cbiAgICBpZiAoIUNvbXBvbmVudCkge1xuICAgICAgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuICAgIH1cblxuICAgIFJlYWN0RE9NLnJlbmRlcig8Q29tcG9uZW50IGRlbGVnYXRlPXtkZWxlZ2F0ZX0gLz4sIHRoaXMuZWxlbWVudClcbiAgfVxuICBnZXRVUkkoKSB7XG4gICAgcmV0dXJuIFdPUktTUEFDRV9VUklcbiAgfVxuICBnZXRUaXRsZSgpIHtcbiAgICByZXR1cm4gJ0xpbnRlcidcbiAgfVxuICBnZXREZWZhdWx0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuICdib3R0b20nXG4gIH1cbiAgZ2V0QWxsb3dlZExvY2F0aW9ucygpIHtcbiAgICByZXR1cm4gWydjZW50ZXInLCAnYm90dG9tJywgJ3RvcCddXG4gIH1cbiAgZ2V0UHJlZmVycmVkSGVpZ2h0KCkge1xuICAgIHJldHVybiBhdG9tLmNvbmZpZy5nZXQoJ2xpbnRlci11aS1kZWZhdWx0LnBhbmVsSGVpZ2h0JylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIGNvbnN0IHBhcmVudEVsZW1lbnQgPSB0aGlzLmVsZW1lbnQucGFyZW50RWxlbWVudFxuICAgIGlmIChwYXJlbnRFbGVtZW50KSB7XG4gICAgICBjb25zdCB7IGhlaWdodCB9ID0gcGFyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItdWktZGVmYXVsdC5wYW5lbEhlaWdodCcsIGhlaWdodClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgY29uc3QgcGFuZUNvbnRhaW5lciA9IGF0b20ud29ya3NwYWNlLnBhbmVDb250YWluZXJGb3JJdGVtKHRoaXMpXG4gICAgaWYgKHBhbmVDb250YWluZXIpIHtcbiAgICAgIHBhbmVDb250YWluZXIucGFuZUZvckl0ZW0odGhpcykuZGVzdHJveUl0ZW0odGhpcywgdHJ1ZSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbERvY2tcbiJdfQ==