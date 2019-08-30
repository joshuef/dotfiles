Object.defineProperty(exports, '__esModule', {
  value: true
});

/** @jsx jsx */

var _vanillaJsx = require('vanilla-jsx');

// eslint-disable-line no-unused-vars

var _helpers = require('../helpers');

exports['default'] = (0, _vanillaJsx.createClass)({
  renderView: function renderView(suggestions, selectCallback) {
    var className = 'select-list popover-list';
    if (suggestions.length > 7) {
      className += ' intentions-scroll';
    }

    this.suggestions = suggestions;
    this.suggestionsCount = suggestions.length;
    this.suggestionsIndex = -1;
    this.selectCallback = selectCallback;

    return (0, _vanillaJsx.jsx)(
      'intentions-list',
      { 'class': className, id: 'intentions-list' },
      (0, _vanillaJsx.jsx)(
        'ol',
        { 'class': 'list-group', ref: 'list' },
        suggestions.map(function (suggestion) {
          return (0, _vanillaJsx.jsx)(
            'li',
            null,
            (0, _vanillaJsx.jsx)(
              'span',
              { 'class': suggestion[_helpers.$class], 'on-click': function () {
                  selectCallback(suggestion);
                } },
              suggestion.title
            )
          );
        })
      )
    );
  },
  move: function move(movement) {
    var newIndex = this.suggestionsIndex;

    if (movement === 'up') {
      newIndex--;
    } else if (movement === 'down') {
      newIndex++;
    } else if (movement === 'move-to-top') {
      newIndex = 0;
    } else if (movement === 'move-to-bottom') {
      newIndex = this.suggestionsCount;
    }
    // TODO: Implement page up/down
    newIndex = newIndex % this.suggestionsCount;
    if (newIndex < 0) {
      newIndex = this.suggestionsCount + newIndex;
    }
    this.selectIndex(newIndex);
  },
  selectIndex: function selectIndex(index) {
    if (this.refs.active) {
      this.refs.active.classList.remove('selected');
    }

    this.refs.active = this.refs.list.children[index];
    this.refs.active.classList.add('selected');

    this.refs.active.scrollIntoViewIfNeeded(false);
    this.suggestionsIndex = index;
  },
  select: function select() {
    this.selectCallback(this.suggestions[this.suggestionsIndex]);
  }
});
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvaW50ZW50aW9ucy9saWIvZWxlbWVudHMvbGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7MEJBR2lDLGFBQWE7Ozs7dUJBQ3ZCLFlBQVk7O3FCQUdwQiw2QkFBWTtBQUN6QixZQUFVLEVBQUEsb0JBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRTtBQUN0QyxRQUFJLFNBQVMsR0FBRywwQkFBMEIsQ0FBQTtBQUMxQyxRQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzFCLGVBQVMsSUFBSSxvQkFBb0IsQ0FBQTtLQUNsQzs7QUFFRCxRQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTtBQUM5QixRQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQTtBQUMxQyxRQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUE7O0FBRXBDLFdBQU87O1FBQWlCLFNBQU8sU0FBUyxBQUFDLEVBQUMsRUFBRSxFQUFDLGlCQUFpQjtNQUM1RDs7VUFBSSxTQUFNLFlBQVksRUFBQyxHQUFHLEVBQUMsTUFBTTtRQUM5QixXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVMsVUFBVSxFQUFFO0FBQ3BDLGlCQUFPOzs7WUFDTDs7Z0JBQU0sU0FBTyxVQUFVLGlCQUFRLEFBQUMsRUFBQyxZQUFVLFlBQVc7QUFDcEQsZ0NBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtpQkFDM0IsQUFBQztjQUFFLFVBQVUsQ0FBQyxLQUFLO2FBQVE7V0FDekIsQ0FBQTtTQUNOLENBQUM7T0FDQztLQUNXLENBQUE7R0FDbkI7QUFDRCxNQUFJLEVBQUEsY0FBQyxRQUFzQixFQUFFO0FBQzNCLFFBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQTs7QUFFcEMsUUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO0FBQ3JCLGNBQVEsRUFBRSxDQUFBO0tBQ1gsTUFBTSxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUU7QUFDOUIsY0FBUSxFQUFFLENBQUE7S0FDWCxNQUFNLElBQUksUUFBUSxLQUFLLGFBQWEsRUFBRTtBQUNyQyxjQUFRLEdBQUcsQ0FBQyxDQUFBO0tBQ2IsTUFBTSxJQUFJLFFBQVEsS0FBSyxnQkFBZ0IsRUFBRTtBQUN4QyxjQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFBO0tBQ2pDOztBQUVELFlBQVEsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFBO0FBQzNDLFFBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtBQUNoQixjQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQTtLQUM1QztBQUNELFFBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7R0FDM0I7QUFDRCxhQUFXLEVBQUEscUJBQUMsS0FBSyxFQUFFO0FBQ2pCLFFBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDcEIsVUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUM5Qzs7QUFFRCxRQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDakQsUUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTs7QUFFMUMsUUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDOUMsUUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQTtHQUM5QjtBQUNELFFBQU0sRUFBQSxrQkFBRztBQUNQLFFBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBO0dBQzdEO0NBQ0YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvam9zaC9kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2ludGVudGlvbnMvbGliL2VsZW1lbnRzL2xpc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG4vKiogQGpzeCBqc3ggKi9cbmltcG9ydCB7IGNyZWF0ZUNsYXNzLCBqc3ggfSBmcm9tICd2YW5pbGxhLWpzeCcgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuaW1wb3J0IHsgJGNsYXNzIH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGlzdE1vdmVtZW50IH0gZnJvbSAnLi4vdHlwZXMnXG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyVmlldyhzdWdnZXN0aW9ucywgc2VsZWN0Q2FsbGJhY2spIHtcbiAgICBsZXQgY2xhc3NOYW1lID0gJ3NlbGVjdC1saXN0IHBvcG92ZXItbGlzdCdcbiAgICBpZiAoc3VnZ2VzdGlvbnMubGVuZ3RoID4gNykge1xuICAgICAgY2xhc3NOYW1lICs9ICcgaW50ZW50aW9ucy1zY3JvbGwnXG4gICAgfVxuXG4gICAgdGhpcy5zdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zXG4gICAgdGhpcy5zdWdnZXN0aW9uc0NvdW50ID0gc3VnZ2VzdGlvbnMubGVuZ3RoXG4gICAgdGhpcy5zdWdnZXN0aW9uc0luZGV4ID0gLTFcbiAgICB0aGlzLnNlbGVjdENhbGxiYWNrID0gc2VsZWN0Q2FsbGJhY2tcblxuICAgIHJldHVybiA8aW50ZW50aW9ucy1saXN0IGNsYXNzPXtjbGFzc05hbWV9IGlkPVwiaW50ZW50aW9ucy1saXN0XCI+XG4gICAgICA8b2wgY2xhc3M9XCJsaXN0LWdyb3VwXCIgcmVmPVwibGlzdFwiPlxuICAgICAgICB7c3VnZ2VzdGlvbnMubWFwKGZ1bmN0aW9uKHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgICByZXR1cm4gPGxpPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9e3N1Z2dlc3Rpb25bJGNsYXNzXX0gb24tY2xpY2s9e2Z1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxlY3RDYWxsYmFjayhzdWdnZXN0aW9uKVxuICAgICAgICAgICAgfX0+e3N1Z2dlc3Rpb24udGl0bGV9PC9zcGFuPlxuICAgICAgICAgIDwvbGk+XG4gICAgICAgIH0pfVxuICAgICAgPC9vbD5cbiAgICA8L2ludGVudGlvbnMtbGlzdD5cbiAgfSxcbiAgbW92ZShtb3ZlbWVudDogTGlzdE1vdmVtZW50KSB7XG4gICAgbGV0IG5ld0luZGV4ID0gdGhpcy5zdWdnZXN0aW9uc0luZGV4XG5cbiAgICBpZiAobW92ZW1lbnQgPT09ICd1cCcpIHtcbiAgICAgIG5ld0luZGV4LS1cbiAgICB9IGVsc2UgaWYgKG1vdmVtZW50ID09PSAnZG93bicpIHtcbiAgICAgIG5ld0luZGV4KytcbiAgICB9IGVsc2UgaWYgKG1vdmVtZW50ID09PSAnbW92ZS10by10b3AnKSB7XG4gICAgICBuZXdJbmRleCA9IDBcbiAgICB9IGVsc2UgaWYgKG1vdmVtZW50ID09PSAnbW92ZS10by1ib3R0b20nKSB7XG4gICAgICBuZXdJbmRleCA9IHRoaXMuc3VnZ2VzdGlvbnNDb3VudFxuICAgIH1cbiAgICAvLyBUT0RPOiBJbXBsZW1lbnQgcGFnZSB1cC9kb3duXG4gICAgbmV3SW5kZXggPSBuZXdJbmRleCAlIHRoaXMuc3VnZ2VzdGlvbnNDb3VudFxuICAgIGlmIChuZXdJbmRleCA8IDApIHtcbiAgICAgIG5ld0luZGV4ID0gdGhpcy5zdWdnZXN0aW9uc0NvdW50ICsgbmV3SW5kZXhcbiAgICB9XG4gICAgdGhpcy5zZWxlY3RJbmRleChuZXdJbmRleClcbiAgfSxcbiAgc2VsZWN0SW5kZXgoaW5kZXgpIHtcbiAgICBpZiAodGhpcy5yZWZzLmFjdGl2ZSkge1xuICAgICAgdGhpcy5yZWZzLmFjdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpXG4gICAgfVxuXG4gICAgdGhpcy5yZWZzLmFjdGl2ZSA9IHRoaXMucmVmcy5saXN0LmNoaWxkcmVuW2luZGV4XVxuICAgIHRoaXMucmVmcy5hY3RpdmUuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKVxuXG4gICAgdGhpcy5yZWZzLmFjdGl2ZS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKVxuICAgIHRoaXMuc3VnZ2VzdGlvbnNJbmRleCA9IGluZGV4XG4gIH0sXG4gIHNlbGVjdCgpIHtcbiAgICB0aGlzLnNlbGVjdENhbGxiYWNrKHRoaXMuc3VnZ2VzdGlvbnNbdGhpcy5zdWdnZXN0aW9uc0luZGV4XSlcbiAgfSxcbn0pXG4iXX0=