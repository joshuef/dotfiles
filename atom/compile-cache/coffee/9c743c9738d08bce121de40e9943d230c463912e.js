
/*
  lib/simple-drag-drop-text.coffee
 */

(function() {
  var $, SimpleDragDropText, SubAtom;

  $ = require('jquery');

  SubAtom = require('sub-atom');

  SimpleDragDropText = (function() {
    function SimpleDragDropText() {}

    SimpleDragDropText.prototype.config = {
      copyKey: {
        type: 'string',
        "default": 'ctrl',
        description: 'Select modifier key for copy action',
        "enum": ['alt', 'ctrl', 'meta']
      }
    };

    SimpleDragDropText.prototype.activate = function() {
      this.subs = new SubAtom;
      this.subs.add('body', 'mouseup', (function(_this) {
        return function(e) {
          if (_this.mouseIsDown) {
            return _this.clear(e[atom.config.get('simple-drag-drop-text.copyKey') + 'Key']);
          }
        };
      })(this));
      this.subs.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.setEditor();
        };
      })(this)));
      return this.subs.add(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function(editor) {
          return _this.setEditor();
        };
      })(this)));
    };

    SimpleDragDropText.prototype.setEditor = function() {
      return process.nextTick((function(_this) {
        return function() {
          var ref;
          if (!(_this.editor = atom.workspace.getActiveTextEditor())) {
            _this.clear();
            return;
          }
          if ((ref = _this.linesSubs) != null) {
            ref.dispose();
          }
          _this.lines = atom.views.getView(_this.editor);
          _this.lines = _this.lines.querySelector('.lines');
          _this.linesSubs = new SubAtom;
          _this.linesSubs.add(_this.lines, 'mousedown', function(e) {
            return _this.mousedown(e);
          });
          return _this.linesSubs.add(_this.lines, 'mousemove', function(e) {
            if (_this.mouseIsDown && e.which > 0) {
              return _this.drag();
            } else {
              return _this.clear();
            }
          });
        };
      })(this));
    };

    SimpleDragDropText.prototype.mousedown = function(e) {
      var inSelection;
      if (!this.editor) {
        this.clear();
        return;
      }
      this.selMarker = this.editor.getLastSelection().marker;
      this.selBufferRange = this.selMarker.getBufferRange();
      if (this.selBufferRange.isEmpty()) {
        return;
      }
      inSelection = false;
      $(this.lines).find('.highlights .highlight.selection .region').each((function(_this) {
        return function(__, ele) {
          var bottom, left, ref, ref1, ref2, right, top;
          ref = ele.getBoundingClientRect(), left = ref.left, top = ref.top, right = ref.right, bottom = ref.bottom;
          if ((left <= (ref1 = e.pageX) && ref1 < right) && (top <= (ref2 = e.pageY) && ref2 < bottom)) {
            inSelection = true;
            return false;
          }
        };
      })(this));
      if (!inSelection) {
        return;
      }
      this.text = this.editor.getTextInBufferRange(this.selBufferRange);
      this.marker = this.editor.markBufferRange(this.selBufferRange, this.selMarker.getProperties());
      this.editor.decorateMarker(this.marker, {
        type: 'highlight',
        "class": 'selection'
      });
      return this.mouseIsDown = true;
    };

    SimpleDragDropText.prototype.drag = function() {
      var selection;
      this.isDragging = true;
      selection = this.editor.getLastSelection();
      return process.nextTick(function() {
        return selection.clear();
      });
    };

    SimpleDragDropText.prototype.drop = function(altKey) {
      var checkpointBefore, cursorPos;
      checkpointBefore = this.editor.createCheckpoint();
      if (!altKey) {
        this.editor.setTextInBufferRange(this.selBufferRange, '');
      }
      cursorPos = this.editor.getLastSelection().marker.getBufferRange().start;
      this.editor.setTextInBufferRange([cursorPos, cursorPos], this.text);
      return this.editor.groupChangesSinceCheckpoint(checkpointBefore);
    };

    SimpleDragDropText.prototype.clear = function(altKey) {
      var ref;
      if ((altKey != null) && this.isDragging) {
        this.drop(altKey);
      }
      this.mouseIsDown = this.isDragging = false;
      return (ref = this.marker) != null ? ref.destroy() : void 0;
    };

    SimpleDragDropText.prototype.deactivate = function() {
      var ref;
      this.clear();
      if ((ref = this.linesSubs) != null) {
        ref.dispose();
      }
      return this.subs.dispose();
    };

    return SimpleDragDropText;

  })();

  module.exports = new SimpleDragDropText;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvc2ltcGxlLWRyYWctZHJvcC10ZXh0L2xpYi9zaW1wbGUtZHJhZy1kcm9wLXRleHQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQTs7OztBQUFBO0FBQUEsTUFBQTs7RUFJQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osT0FBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztFQUVKOzs7aUNBQ0osTUFBQSxHQUNFO01BQUEsT0FBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE1BRFQ7UUFFQSxXQUFBLEVBQWEscUNBRmI7UUFHQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsS0FBRCxFQUFRLE1BQVIsRUFBZ0IsTUFBaEIsQ0FITjtPQURGOzs7aUNBTUYsUUFBQSxHQUFVLFNBQUE7TUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUk7TUFFWixJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxNQUFWLEVBQWtCLFNBQWxCLEVBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxDQUFEO1VBQU8sSUFBRyxLQUFDLENBQUEsV0FBSjttQkFBcUIsS0FBQyxDQUFBLEtBQUQsQ0FBTyxDQUFFLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLCtCQUFoQixDQUFBLEdBQWlELEtBQWpELENBQVQsRUFBckI7O1FBQVA7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdCO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUF5QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFBWSxLQUFDLENBQUEsU0FBRCxDQUFBO1FBQVo7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpDLENBQVY7YUFDQSxJQUFD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QUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFVBQUQsR0FBYzs4Q0FDdEIsQ0FBRSxPQUFULENBQUE7SUFISzs7aUNBS1AsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTs7V0FDVSxDQUFFLE9BQVosQ0FBQTs7YUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBQTtJQUhVOzs7Ozs7RUFLZCxNQUFNLENBQUMsT0FBUCxHQUFpQixJQUFJO0FBaEZyQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyMjXG4gIGxpYi9zaW1wbGUtZHJhZy1kcm9wLXRleHQuY29mZmVlXG4jIyNcblxuJCA9IHJlcXVpcmUgJ2pxdWVyeSdcblN1YkF0b20gPSByZXF1aXJlICdzdWItYXRvbSdcblxuY2xhc3MgU2ltcGxlRHJhZ0Ryb3BUZXh0XG4gIGNvbmZpZzpcbiAgICBjb3B5S2V5OlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdjdHJsJ1xuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgbW9kaWZpZXIga2V5IGZvciBjb3B5IGFjdGlvbidcbiAgICAgIGVudW06IFsnYWx0JywgJ2N0cmwnLCAnbWV0YSddXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHN1YnMgPSBuZXcgU3ViQXRvbVxuXG4gICAgQHN1YnMuYWRkICdib2R5JywgJ21vdXNldXAnLCAoZSkgPT4gaWYgQG1vdXNlSXNEb3duIHRoZW4gQGNsZWFyIGVbYXRvbS5jb25maWcuZ2V0KCdzaW1wbGUtZHJhZy1kcm9wLXRleHQuY29weUtleScpKydLZXknXVxuICAgIEBzdWJzLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgICAgICAgIChlZGl0b3IpID0+IEBzZXRFZGl0b3IoKVxuICAgIEBzdWJzLmFkZCBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtIChlZGl0b3IpID0+IEBzZXRFZGl0b3IoKVxuXG4gIHNldEVkaXRvcjogLT5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+XG4gICAgICBpZiBub3QgKEBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIHJldHVyblxuXG4gICAgICBAbGluZXNTdWJzPy5kaXNwb3NlKClcbiAgICAgIEBsaW5lcyA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgICAgQGxpbmVzID0gQGxpbmVzLnF1ZXJ5U2VsZWN0b3IgJy5saW5lcydcbiAgICAgIEBsaW5lc1N1YnMgPSBuZXcgU3ViQXRvbVxuICAgICAgQGxpbmVzU3Vicy5hZGQgQGxpbmVzLCAnbW91c2Vkb3duJywgKGUpID0+IEBtb3VzZWRvd24gZVxuICAgICAgQGxpbmVzU3Vicy5hZGQgQGxpbmVzLCAnbW91c2Vtb3ZlJywgKGUpID0+XG4gICAgICAgIGlmIEBtb3VzZUlzRG93biBhbmQgZS53aGljaCA+IDAgdGhlbiBAZHJhZygpIGVsc2UgQGNsZWFyKClcblxuICBtb3VzZWRvd246IChlKSAtPlxuICAgIGlmIG5vdCBAZWRpdG9yIHRoZW4gQGNsZWFyKCk7IHJldHVyblxuXG4gICAgQHNlbE1hcmtlciA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLm1hcmtlclxuICAgIEBzZWxCdWZmZXJSYW5nZSA9IEBzZWxNYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGlmIEBzZWxCdWZmZXJSYW5nZS5pc0VtcHR5KCkgdGhlbiByZXR1cm5cblxuICAgIGluU2VsZWN0aW9uID0gbm9cbiAgICAkKEBsaW5lcykuZmluZCgnLmhpZ2hsaWdodHMgLmhpZ2hsaWdodC5zZWxlY3Rpb24gLnJlZ2lvbicpLmVhY2ggKF9fLCBlbGUpID0+XG4gICAgICB7bGVmdCwgdG9wLCByaWdodCwgYm90dG9tfSA9IGVsZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgaWYgbGVmdCA8PSBlLnBhZ2VYIDwgcmlnaHQgYW5kXG4gICAgICAgICAgdG9wIDw9IGUucGFnZVkgPCBib3R0b21cbiAgICAgICAgaW5TZWxlY3Rpb24gPSB5ZXNcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgaWYgbm90IGluU2VsZWN0aW9uIHRoZW4gcmV0dXJuXG5cbiAgICBAdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlXG4gICAgQG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlIEBzZWxCdWZmZXJSYW5nZSwgQHNlbE1hcmtlci5nZXRQcm9wZXJ0aWVzKClcbiAgICBAZWRpdG9yLmRlY29yYXRlTWFya2VyIEBtYXJrZXIsIHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ3NlbGVjdGlvbidcblxuICAgIEBtb3VzZUlzRG93biA9IHllc1xuXG4gIGRyYWc6IC0+XG4gICAgQGlzRHJhZ2dpbmcgPSB5ZXNcbiAgICBzZWxlY3Rpb24gPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgIHByb2Nlc3MubmV4dFRpY2sgLT4gc2VsZWN0aW9uLmNsZWFyKClcblxuICBkcm9wOiAoYWx0S2V5KSAtPlxuICAgIGNoZWNrcG9pbnRCZWZvcmUgPSBAZWRpdG9yLmNyZWF0ZUNoZWNrcG9pbnQoKVxuICAgIGlmIG5vdCBhbHRLZXkgdGhlbiBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlIEBzZWxCdWZmZXJSYW5nZSwgJydcbiAgICBjdXJzb3JQb3MgPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5tYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgW2N1cnNvclBvcywgY3Vyc29yUG9zXSwgQHRleHRcbiAgICBAZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludCBjaGVja3BvaW50QmVmb3JlXG5cbiAgY2xlYXI6IChhbHRLZXkpIC0+XG4gICAgaWYgYWx0S2V5PyBhbmQgQGlzRHJhZ2dpbmcgdGhlbiBAZHJvcCBhbHRLZXlcbiAgICBAbW91c2VJc0Rvd24gPSBAaXNEcmFnZ2luZyA9IG5vXG4gICAgQG1hcmtlcj8uZGVzdHJveSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAY2xlYXIoKVxuICAgIEBsaW5lc1N1YnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzLmRpc3Bvc2UoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTaW1wbGVEcmFnRHJvcFRleHRcbiJdfQ==
