var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _helpers = require('../helpers');

var React = undefined;
var ReactDOM = undefined;
var Component = undefined;

// eslint-disable-next-line no-use-before-define
function getPaneContainer(item) {
  var paneContainer = atom.workspace.paneContainerForItem(item);
  // NOTE: This is an internal API access
  // It's necessary because there's no Public API for it yet
  if (paneContainer && typeof paneContainer.state === 'object' && typeof paneContainer.state.size === 'number' && typeof paneContainer.render === 'function') {
    return paneContainer;
  }
  return null;
}

var PanelDock = (function () {
  function PanelDock(delegate) {
    var _this = this;

    _classCallCheck(this, PanelDock);

    this.element = document.createElement('div');
    this.subscriptions = new _atom.CompositeDisposable();

    this.lastSetPaneHeight = null;
    this.subscriptions.add(atom.config.observe('linter-ui-default.panelHeight', function (panelHeight) {
      var changed = typeof _this.panelHeight === 'number';
      _this.panelHeight = panelHeight;
      if (changed) {
        _this.doPanelResize(true);
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.alwaysTakeMinimumSpace', function (alwaysTakeMinimumSpace) {
      _this.alwaysTakeMinimumSpace = alwaysTakeMinimumSpace;
    }));
    this.doPanelResize();

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

  // NOTE: Chose a name that won't conflict with Dock APIs

  _createClass(PanelDock, [{
    key: 'doPanelResize',
    value: function doPanelResize() {
      var forConfigHeight = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      var paneContainer = getPaneContainer(this);
      var minimumHeight = null;
      var paneContainerView = atom.views.getView(paneContainer);
      if (paneContainerView && this.alwaysTakeMinimumSpace) {
        // NOTE: Super horrible hack but the only possible way I could find :((
        var dockNamesElement = paneContainerView.querySelector('.list-inline.tab-bar.inset-panel');
        var dockNamesRects = dockNamesElement ? dockNamesElement.getClientRects()[0] : null;
        var tableElement = this.element.querySelector('table');
        var panelRects = tableElement ? tableElement.getClientRects()[0] : null;
        if (dockNamesRects && panelRects) {
          minimumHeight = dockNamesRects.height + panelRects.height + 1;
        }
      }

      if (paneContainer) {
        var updateConfigHeight = null;
        var heightSet = minimumHeight !== null && !forConfigHeight ? Math.min(minimumHeight, this.panelHeight) : this.panelHeight;

        // Person resized the panel, save new resized value to config
        if (this.lastSetPaneHeight !== null && paneContainer.state.size !== this.lastSetPaneHeight && !forConfigHeight) {
          updateConfigHeight = paneContainer.state.size;
        }

        this.lastSetPaneHeight = heightSet;
        paneContainer.state.size = heightSet;
        paneContainer.render(paneContainer.state);

        if (updateConfigHeight !== null) {
          atom.config.set('linter-ui-default.panelHeight', updateConfigHeight);
        }
      }
    }
  }, {
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
      this.subscriptions.dispose();
      var paneContainer = getPaneContainer(this);
      if (paneContainer && !this.alwaysTakeMinimumSpace && paneContainer.state.size !== this.panelHeight) {
        atom.config.set('linter-ui-default.panelHeight', paneContainer.state.size);
        paneContainer.paneForItem(this).destroyItem(this, true);
      }
    }
  }]);

  return PanelDock;
})();

module.exports = PanelDock;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL3BhbmVsL2RvY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztvQkFFb0MsTUFBTTs7dUJBQ1osWUFBWTs7QUFFMUMsSUFBSSxLQUFLLFlBQUEsQ0FBQTtBQUNULElBQUksUUFBUSxZQUFBLENBQUE7QUFDWixJQUFJLFNBQVMsWUFBQSxDQUFBOzs7QUFHYixTQUFTLGdCQUFnQixDQUFDLElBQWUsRUFBRTtBQUN6QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFBOzs7QUFHL0QsTUFDRSxhQUFhLElBQ2IsT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFDdkMsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLElBQzVDLE9BQU8sYUFBYSxDQUFDLE1BQU0sS0FBSyxVQUFVLEVBQzFDO0FBQ0EsV0FBTyxhQUFhLENBQUE7R0FDckI7QUFDRCxTQUFPLElBQUksQ0FBQTtDQUNaOztJQUVLLFNBQVM7QUFPRixXQVBQLFNBQVMsQ0FPRCxRQUFnQixFQUFFOzs7MEJBUDFCLFNBQVM7O0FBUVgsUUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVDLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7O0FBRTlDLFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7QUFDN0IsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLCtCQUErQixFQUFFLFVBQUEsV0FBVyxFQUFJO0FBQ2xFLFVBQU0sT0FBTyxHQUFHLE9BQU8sTUFBSyxXQUFXLEtBQUssUUFBUSxDQUFBO0FBQ3BELFlBQUssV0FBVyxHQUFHLFdBQVcsQ0FBQTtBQUM5QixVQUFJ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QyxDQUFBO1NBQ3JFO09BQ0Y7S0FDRjs7O1dBQ0ssa0JBQUc7QUFDUCxvQ0FBb0I7S0FDckI7OztXQUNPLG9CQUFHO0FBQ1QsYUFBTyxRQUFRLENBQUE7S0FDaEI7OztXQUNpQiw4QkFBRztBQUNuQixhQUFPLFFBQVEsQ0FBQTtLQUNoQjs7O1dBQ2tCLCtCQUFHO0FBQ3BCLGFBQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ25DOzs7V0FDaUIsOEJBQUc7QUFDbkIsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO0tBQ3hEOzs7V0FDTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDNUIsVUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDNUMsVUFBSSxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNsRyxZQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQzFFLHFCQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7T0FDeEQ7S0FDRjs7O1NBakdHLFNBQVM7OztBQW9HZixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQSIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9wYW5lbC9kb2NrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBXT1JLU1BBQ0VfVVJJIH0gZnJvbSAnLi4vaGVscGVycydcblxubGV0IFJlYWN0XG5sZXQgUmVhY3RET01cbmxldCBDb21wb25lbnRcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG5mdW5jdGlvbiBnZXRQYW5lQ29udGFpbmVyKGl0ZW06IFBhbmVsRG9jaykge1xuICBjb25zdCBwYW5lQ29udGFpbmVyID0gYXRvbS53b3Jrc3BhY2UucGFuZUNvbnRhaW5lckZvckl0ZW0oaXRlbSlcbiAgLy8gTk9URTogVGhpcyBpcyBhbiBpbnRlcm5hbCBBUEkgYWNjZXNzXG4gIC8vIEl0J3MgbmVjZXNzYXJ5IGJlY2F1c2UgdGhlcmUncyBubyBQdWJsaWMgQVBJIGZvciBpdCB5ZXRcbiAgaWYgKFxuICAgIHBhbmVDb250YWluZXIgJiZcbiAgICB0eXBlb2YgcGFuZUNvbnRhaW5lci5zdGF0ZSA9PT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2YgcGFuZUNvbnRhaW5lci5zdGF0ZS5zaXplID09PSAnbnVtYmVyJyAmJlxuICAgIHR5cGVvZiBwYW5lQ29udGFpbmVyLnJlbmRlciA9PT0gJ2Z1bmN0aW9uJ1xuICApIHtcbiAgICByZXR1cm4gcGFuZUNvbnRhaW5lclxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmNsYXNzIFBhbmVsRG9jayB7XG4gIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gIHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgcGFuZWxIZWlnaHQ6IG51bWJlclxuICBhbHdheXNUYWtlTWluaW11bVNwYWNlOiBib29sZWFuXG4gIGxhc3RTZXRQYW5lSGVpZ2h0OiBudW1iZXIgfCBudWxsXG5cbiAgY29uc3RydWN0b3IoZGVsZWdhdGU6IE9iamVjdCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgdGhpcy5sYXN0U2V0UGFuZUhlaWdodCA9IG51bGxcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQucGFuZWxIZWlnaHQnLCBwYW5lbEhlaWdodCA9PiB7XG4gICAgICAgIGNvbnN0IGNoYW5nZWQgPSB0eXBlb2YgdGhpcy5wYW5lbEhlaWdodCA9PT0gJ251bWJlcidcbiAgICAgICAgdGhpcy5wYW5lbEhlaWdodCA9IHBhbmVsSGVpZ2h0XG4gICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgdGhpcy5kb1BhbmVsUmVzaXplKHRydWUpXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgIClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuYWx3YXlzVGFrZU1pbmltdW1TcGFjZScsIGFsd2F5c1Rha2VNaW5pbXVtU3BhY2UgPT4ge1xuICAgICAgICB0aGlzLmFsd2F5c1Rha2VNaW5pbXVtU3BhY2UgPSBhbHdheXNUYWtlTWluaW11bVNwYWNlXG4gICAgICB9KSxcbiAgICApXG4gICAgdGhpcy5kb1BhbmVsUmVzaXplKClcblxuICAgIGlmICghUmVhY3QpIHtcbiAgICAgIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKVxuICAgIH1cbiAgICBpZiAoIVJlYWN0RE9NKSB7XG4gICAgICBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpXG4gICAgfVxuICAgIGlmICghQ29tcG9uZW50KSB7XG4gICAgICBDb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG4gICAgfVxuXG4gICAgUmVhY3RET00ucmVuZGVyKDxDb21wb25lbnQgZGVsZWdhdGU9e2RlbGVnYXRlfSAvPiwgdGhpcy5lbGVtZW50KVxuICB9XG4gIC8vIE5PVEU6IENob3NlIGEgbmFtZSB0aGF0IHdvbid0IGNvbmZsaWN0IHdpdGggRG9jayBBUElzXG4gIGRvUGFuZWxSZXNpemUoZm9yQ29uZmlnSGVpZ2h0OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICBjb25zdCBwYW5lQ29udGFpbmVyID0gZ2V0UGFuZUNvbnRhaW5lcih0aGlzKVxuICAgIGxldCBtaW5pbXVtSGVpZ2h0OiBudW1iZXIgfCBudWxsID0gbnVsbFxuICAgIGNvbnN0IHBhbmVDb250YWluZXJWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHBhbmVDb250YWluZXIpXG4gICAgaWYgKHBhbmVDb250YWluZXJWaWV3ICYmIHRoaXMuYWx3YXlzVGFrZU1pbmltdW1TcGFjZSkge1xuICAgICAgLy8gTk9URTogU3VwZXIgaG9ycmlibGUgaGFjayBidXQgdGhlIG9ubHkgcG9zc2libGUgd2F5IEkgY291bGQgZmluZCA6KChcbiAgICAgIGNvbnN0IGRvY2tOYW1lc0VsZW1lbnQgPSBwYW5lQ29udGFpbmVyVmlldy5xdWVyeVNlbGVjdG9yKCcubGlzdC1pbmxpbmUudGFiLWJhci5pbnNldC1wYW5lbCcpXG4gICAgICBjb25zdCBkb2NrTmFtZXNSZWN0cyA9IGRvY2tOYW1lc0VsZW1lbnQgPyBkb2NrTmFtZXNFbGVtZW50LmdldENsaWVudFJlY3RzKClbMF0gOiBudWxsXG4gICAgICBjb25zdCB0YWJsZUVsZW1lbnQgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcigndGFibGUnKVxuICAgICAgY29uc3QgcGFuZWxSZWN0cyA9IHRhYmxlRWxlbWVudCA/IHRhYmxlRWxlbWVudC5nZXRDbGllbnRSZWN0cygpWzBdIDogbnVsbFxuICAgICAgaWYgKGRvY2tOYW1lc1JlY3RzICYmIHBhbmVsUmVjdHMpIHtcbiAgICAgICAgbWluaW11bUhlaWdodCA9IGRvY2tOYW1lc1JlY3RzLmhlaWdodCArIHBhbmVsUmVjdHMuaGVpZ2h0ICsgMVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwYW5lQ29udGFpbmVyKSB7XG4gICAgICBsZXQgdXBkYXRlQ29uZmlnSGVpZ2h0OiBudW1iZXIgfCBudWxsID0gbnVsbFxuICAgICAgY29uc3QgaGVpZ2h0U2V0ID1cbiAgICAgICAgbWluaW11bUhlaWdodCAhPT0gbnVsbCAmJiAhZm9yQ29uZmlnSGVpZ2h0ID8gTWF0aC5taW4obWluaW11bUhlaWdodCwgdGhpcy5wYW5lbEhlaWdodCkgOiB0aGlzLnBhbmVsSGVpZ2h0XG5cbiAgICAgIC8vIFBlcnNvbiByZXNpemVkIHRoZSBwYW5lbCwgc2F2ZSBuZXcgcmVzaXplZCB2YWx1ZSB0byBjb25maWdcbiAgICAgIGlmICh0aGlzLmxhc3RTZXRQYW5lSGVpZ2h0ICE9PSBudWxsICYmIHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZSAhPT0gdGhpcy5sYXN0U2V0UGFuZUhlaWdodCAmJiAhZm9yQ29uZmlnSGVpZ2h0KSB7XG4gICAgICAgIHVwZGF0ZUNvbmZpZ0hlaWdodCA9IHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZVxuICAgICAgfVxuXG4gICAgICB0aGlzLmxhc3RTZXRQYW5lSGVpZ2h0ID0gaGVpZ2h0U2V0XG4gICAgICBwYW5lQ29udGFpbmVyLnN0YXRlLnNpemUgPSBoZWlnaHRTZXRcbiAgICAgIHBhbmVDb250YWluZXIucmVuZGVyKHBhbmVDb250YWluZXIuc3RhdGUpXG5cbiAgICAgIGlmICh1cGRhdGVDb25maWdIZWlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItdWktZGVmYXVsdC5wYW5lbEhlaWdodCcsIHVwZGF0ZUNvbmZpZ0hlaWdodClcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0VVJJKCkge1xuICAgIHJldHVybiBXT1JLU1BBQ0VfVVJJXG4gIH1cbiAgZ2V0VGl0bGUoKSB7XG4gICAgcmV0dXJuICdMaW50ZXInXG4gIH1cbiAgZ2V0RGVmYXVsdExvY2F0aW9uKCkge1xuICAgIHJldHVybiAnYm90dG9tJ1xuICB9XG4gIGdldEFsbG93ZWRMb2NhdGlvbnMoKSB7XG4gICAgcmV0dXJuIFsnY2VudGVyJywgJ2JvdHRvbScsICd0b3AnXVxuICB9XG4gIGdldFByZWZlcnJlZEhlaWdodCgpIHtcbiAgICByZXR1cm4gYXRvbS5jb25maWcuZ2V0KCdsaW50ZXItdWktZGVmYXVsdC5wYW5lbEhlaWdodCcpXG4gIH1cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgY29uc3QgcGFuZUNvbnRhaW5lciA9IGdldFBhbmVDb250YWluZXIodGhpcylcbiAgICBpZiAocGFuZUNvbnRhaW5lciAmJiAhdGhpcy5hbHdheXNUYWtlTWluaW11bVNwYWNlICYmIHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZSAhPT0gdGhpcy5wYW5lbEhlaWdodCkge1xuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXItdWktZGVmYXVsdC5wYW5lbEhlaWdodCcsIHBhbmVDb250YWluZXIuc3RhdGUuc2l6ZSlcbiAgICAgIHBhbmVDb250YWluZXIucGFuZUZvckl0ZW0odGhpcykuZGVzdHJveUl0ZW0odGhpcywgdHJ1ZSlcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbERvY2tcbiJdfQ==