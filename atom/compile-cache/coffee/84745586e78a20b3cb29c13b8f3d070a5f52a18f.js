
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
          _this.views = atom.views.getView(_this.editor);
          _this.lines = _this.views.querySelector('.lines');
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
      this.highlights = $(this.lines).find('.highlights');
      this.highlights = 0 === this.highlights.length ? this.views.querySelector('.highlights') : this.highlights;
      $(this.highlights).find('.highlight.selection .region').each((function(_this) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9zaW1wbGUtZHJhZy1kcm9wLXRleHQvbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBOzs7O0FBQUE7QUFBQSxNQUFBOztFQUlBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUjs7RUFDSixPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0VBRUo7OztpQ0FDSixNQUFBLEdBQ0U7TUFBQSxPQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsTUFEVDtRQUVBLFdBQUEsRUFBYSxxQ0FGYjtRQUdBLENBQUEsSUFBQSxDQUFBLEVBQU0sQ0FBQyxLQUFELEVBQVEsTUFBUixFQUFnQixNQUFoQixDQUhOO09BREY7OztpQ0FNRixRQUFBLEdBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSTtNQUVaLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLE1BQVYsRUFBa0IsU0FBbEIsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7VUFBTyxJQUFHLEtBQUMsQ0FBQSxXQUFKO21CQUFxQixLQUFDLENBQUEsS0FBRCxDQUFPLENBQUUsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLENBQUEsR0FBaUQsS0FBakQsQ0FBVCxFQUFyQjs7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUFZLEtBQUMsQ0FBQSxTQUFELENBQUE7UUFBWjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekMsQ0FBVjth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QyxTQUFELEVBQVksU0FBWixDQUE3QixFQUFxRCxJQUFDLENBQUEsSUFBdEQ7YUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLDJCQUFSLENBQW9DLGdCQUFwQztJQUxJOztpQ0FPTixLQUFBLEdBQU8sU0FBQyxNQUFEO0FBQ0wsVUFBQTtNQUFBLElBQUcsZ0JBQUEsSUFBWSxJQUFDLENBQUEsVUFBaEI7UUFBZ0MsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOLEVBQWhDOztNQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFVBQUQsR0FBYzs4Q0FDdEIsQ0FBRSxPQUFULENBQUE7SUFISzs7aUNBS1AsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTs7V0FDVSxDQUFFLE9BQVosQ0FBQTs7YUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBQTtJQUhVOzs7Ozs7RUFLZCxNQUFNLENBQUMsT0FBUCxHQUFpQixJQUFJO0FBcEZyQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyMjXG4gIGxpYi9zaW1wbGUtZHJhZy1kcm9wLXRleHQuY29mZmVlXG4jIyNcblxuJCA9IHJlcXVpcmUgJ2pxdWVyeSdcblN1YkF0b20gPSByZXF1aXJlICdzdWItYXRvbSdcblxuY2xhc3MgU2ltcGxlRHJhZ0Ryb3BUZXh0XG4gIGNvbmZpZzpcbiAgICBjb3B5S2V5OlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdjdHJsJ1xuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgbW9kaWZpZXIga2V5IGZvciBjb3B5IGFjdGlvbidcbiAgICAgIGVudW06IFsnYWx0JywgJ2N0cmwnLCAnbWV0YSddXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHN1YnMgPSBuZXcgU3ViQXRvbVxuXG4gICAgQHN1YnMuYWRkICdib2R5JywgJ21vdXNldXAnLCAoZSkgPT4gaWYgQG1vdXNlSXNEb3duIHRoZW4gQGNsZWFyIGVbYXRvbS5jb25maWcuZ2V0KCdzaW1wbGUtZHJhZy1kcm9wLXRleHQuY29weUtleScpKydLZXknXVxuICAgIEBzdWJzLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgICAgICAgIChlZGl0b3IpID0+IEBzZXRFZGl0b3IoKVxuICAgIEBzdWJzLmFkZCBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtIChlZGl0b3IpID0+IEBzZXRFZGl0b3IoKVxuXG4gIHNldEVkaXRvcjogLT5cbiAgICBwcm9jZXNzLm5leHRUaWNrID0+XG4gICAgICBpZiBub3QgKEBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICAgIEBjbGVhcigpXG4gICAgICAgIHJldHVyblxuXG4gICAgICBAbGluZXNTdWJzPy5kaXNwb3NlKClcbiAgICAgIEB2aWV3cyA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgICAgQGxpbmVzID0gQHZpZXdzLnF1ZXJ5U2VsZWN0b3IgJy5saW5lcydcbiAgICAgIEBsaW5lc1N1YnMgPSBuZXcgU3ViQXRvbVxuICAgICAgQGxpbmVzU3Vicy5hZGQgQGxpbmVzLCAnbW91c2Vkb3duJywgKGUpID0+IEBtb3VzZWRvd24gZVxuICAgICAgQGxpbmVzU3Vicy5hZGQgQGxpbmVzLCAnbW91c2Vtb3ZlJywgKGUpID0+XG4gICAgICAgIGlmIEBtb3VzZUlzRG93biBhbmQgZS53aGljaCA+IDAgdGhlbiBAZHJhZygpIGVsc2UgQGNsZWFyKClcblxuICBtb3VzZWRvd246IChlKSAtPlxuICAgIGlmIG5vdCBAZWRpdG9yIHRoZW4gQGNsZWFyKCk7IHJldHVyblxuXG4gICAgQHNlbE1hcmtlciA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLm1hcmtlclxuICAgIEBzZWxCdWZmZXJSYW5nZSA9IEBzZWxNYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGlmIEBzZWxCdWZmZXJSYW5nZS5pc0VtcHR5KCkgdGhlbiByZXR1cm5cblxuICAgIGluU2VsZWN0aW9uID0gbm9cblxuICAgIEBoaWdobGlnaHRzID0gJChAbGluZXMpLmZpbmQoJy5oaWdobGlnaHRzJylcbiAgICBAaGlnaGxpZ2h0cyA9IGlmIDAgPT0gQGhpZ2hsaWdodHMubGVuZ3RoIHRoZW4gQHZpZXdzLnF1ZXJ5U2VsZWN0b3IgJy5oaWdobGlnaHRzJyBlbHNlIEBoaWdobGlnaHRzXG5cbiAgICAkKEBoaWdobGlnaHRzKS5maW5kKCcuaGlnaGxpZ2h0LnNlbGVjdGlvbiAucmVnaW9uJykuZWFjaCAoX18sIGVsZSkgPT5cbiAgICAgIHtsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b219ID0gZWxlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICBpZiBsZWZ0IDw9IGUucGFnZVggPCByaWdodCBhbmRcbiAgICAgICAgICB0b3AgPD0gZS5wYWdlWSA8IGJvdHRvbVxuICAgICAgICBpblNlbGVjdGlvbiA9IHllc1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBpZiBub3QgaW5TZWxlY3Rpb24gdGhlbiByZXR1cm5cblxuICAgIEB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSBAc2VsQnVmZmVyUmFuZ2VcbiAgICBAbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlLCBAc2VsTWFya2VyLmdldFByb3BlcnRpZXMoKVxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgQG1hcmtlciwgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnc2VsZWN0aW9uJ1xuXG4gICAgQG1vdXNlSXNEb3duID0geWVzXG5cbiAgZHJhZzogLT5cbiAgICBAaXNEcmFnZ2luZyA9IHllc1xuICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG4gICAgcHJvY2Vzcy5uZXh0VGljayAtPiBzZWxlY3Rpb24uY2xlYXIoKVxuXG4gIGRyb3A6IChhbHRLZXkpIC0+XG4gICAgY2hlY2twb2ludEJlZm9yZSA9IEBlZGl0b3IuY3JlYXRlQ2hlY2twb2ludCgpXG4gICAgaWYgbm90IGFsdEtleSB0aGVuIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlLCAnJ1xuICAgIGN1cnNvclBvcyA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLm1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBbY3Vyc29yUG9zLCBjdXJzb3JQb3NdLCBAdGV4dFxuICAgIEBlZGl0b3IuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50IGNoZWNrcG9pbnRCZWZvcmVcblxuICBjbGVhcjogKGFsdEtleSkgLT5cbiAgICBpZiBhbHRLZXk/IGFuZCBAaXNEcmFnZ2luZyB0aGVuIEBkcm9wIGFsdEtleVxuICAgIEBtb3VzZUlzRG93biA9IEBpc0RyYWdnaW5nID0gbm9cbiAgICBAbWFya2VyPy5kZXN0cm95KClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBjbGVhcigpXG4gICAgQGxpbmVzU3Vicz8uZGlzcG9zZSgpXG4gICAgQHN1YnMuZGlzcG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNpbXBsZURyYWdEcm9wVGV4dFxuIl19
