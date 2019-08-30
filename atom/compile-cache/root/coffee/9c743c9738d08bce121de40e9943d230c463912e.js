
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9zaW1wbGUtZHJhZy1kcm9wLXRleHQvbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBOzs7O0FBQUE7QUFBQSxNQUFBOztFQUlBLENBQUEsR0FBSSxPQUFBLENBQVEsUUFBUjs7RUFDSixPQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0VBRUo7OztpQ0FDSixNQUFBLEdBQ0U7TUFBQSxPQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sUUFBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsTUFEVDtRQUVBLFdBQUEsRUFBYSxxQ0FGYjtRQUdBLENBQUEsSUFBQSxDQUFBLEVBQU0sQ0FBQyxLQUFELEVBQVEsTUFBUixFQUFnQixNQUFoQixDQUhOO09BREY7OztpQ0FNRixRQUFBLEdBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSTtNQUVaLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLE1BQVYsRUFBa0IsU0FBbEIsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7VUFBTyxJQUFHLEtBQUMsQ0FBQSxXQUFKO21CQUFxQixLQUFDLENBQUEsS0FBRCxDQUFPLENBQUUsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLENBQUEsR0FBaUQsS0FBakQsQ0FBVCxFQUFyQjs7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQXlDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUFZLEtBQUMsQ0FBQSxTQUFELENBQUE7UUFBWjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekMsQ0FBVjth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O01BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsVUFBRCxHQUFjOzhDQUN0QixDQUFFLE9BQVQsQ0FBQTtJQUhLOztpQ0FLUCxVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBOztXQUNVLENBQUUsT0FBWixDQUFBOzthQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBO0lBSFU7Ozs7OztFQUtkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUFoRnJCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIyNcbiAgbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWVcbiMjI1xuXG4kID0gcmVxdWlyZSAnanF1ZXJ5J1xuU3ViQXRvbSA9IHJlcXVpcmUgJ3N1Yi1hdG9tJ1xuXG5jbGFzcyBTaW1wbGVEcmFnRHJvcFRleHRcbiAgY29uZmlnOlxuICAgIGNvcHlLZXk6XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ2N0cmwnXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlbGVjdCBtb2RpZmllciBrZXkgZm9yIGNvcHkgYWN0aW9uJ1xuICAgICAgZW51bTogWydhbHQnLCAnY3RybCcsICdtZXRhJ11cblxuICBhY3RpdmF0ZTogLT5cbiAgICBAc3VicyA9IG5ldyBTdWJBdG9tXG5cbiAgICBAc3Vicy5hZGQgJ2JvZHknLCAnbW91c2V1cCcsIChlKSA9PiBpZiBAbW91c2VJc0Rvd24gdGhlbiBAY2xlYXIgZVthdG9tLmNvbmZpZy5nZXQoJ3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb3B5S2V5JykrJ0tleSddXG4gICAgQHN1YnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAgICAgICAgKGVkaXRvcikgPT4gQHNldEVkaXRvcigpXG4gICAgQHN1YnMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gKGVkaXRvcikgPT4gQHNldEVkaXRvcigpXG5cbiAgc2V0RWRpdG9yOiAtPlxuICAgIHByb2Nlc3MubmV4dFRpY2sgPT5cbiAgICAgIGlmIG5vdCAoQGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIEBsaW5lc1N1YnM/LmRpc3Bvc2UoKVxuICAgICAgQGxpbmVzID0gYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpXG4gICAgICBAbGluZXMgPSBAbGluZXMucXVlcnlTZWxlY3RvciAnLmxpbmVzJ1xuICAgICAgQGxpbmVzU3VicyA9IG5ldyBTdWJBdG9tXG4gICAgICBAbGluZXNTdWJzLmFkZCBAbGluZXMsICdtb3VzZWRvd24nLCAoZSkgPT4gQG1vdXNlZG93biBlXG4gICAgICBAbGluZXNTdWJzLmFkZCBAbGluZXMsICdtb3VzZW1vdmUnLCAoZSkgPT5cbiAgICAgICAgaWYgQG1vdXNlSXNEb3duIGFuZCBlLndoaWNoID4gMCB0aGVuIEBkcmFnKCkgZWxzZSBAY2xlYXIoKVxuXG4gIG1vdXNlZG93bjogKGUpIC0+XG4gICAgaWYgbm90IEBlZGl0b3IgdGhlbiBAY2xlYXIoKTsgcmV0dXJuXG5cbiAgICBAc2VsTWFya2VyID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkubWFya2VyXG4gICAgQHNlbEJ1ZmZlclJhbmdlID0gQHNlbE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaWYgQHNlbEJ1ZmZlclJhbmdlLmlzRW1wdHkoKSB0aGVuIHJldHVyblxuXG4gICAgaW5TZWxlY3Rpb24gPSBub1xuICAgICQoQGxpbmVzKS5maW5kKCcuaGlnaGxpZ2h0cyAuaGlnaGxpZ2h0LnNlbGVjdGlvbiAucmVnaW9uJykuZWFjaCAoX18sIGVsZSkgPT5cbiAgICAgIHtsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b219ID0gZWxlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICBpZiBsZWZ0IDw9IGUucGFnZVggPCByaWdodCBhbmRcbiAgICAgICAgICB0b3AgPD0gZS5wYWdlWSA8IGJvdHRvbVxuICAgICAgICBpblNlbGVjdGlvbiA9IHllc1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBpZiBub3QgaW5TZWxlY3Rpb24gdGhlbiByZXR1cm5cblxuICAgIEB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSBAc2VsQnVmZmVyUmFuZ2VcbiAgICBAbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlLCBAc2VsTWFya2VyLmdldFByb3BlcnRpZXMoKVxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgQG1hcmtlciwgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnc2VsZWN0aW9uJ1xuXG4gICAgQG1vdXNlSXNEb3duID0geWVzXG5cbiAgZHJhZzogLT5cbiAgICBAaXNEcmFnZ2luZyA9IHllc1xuICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG4gICAgcHJvY2Vzcy5uZXh0VGljayAtPiBzZWxlY3Rpb24uY2xlYXIoKVxuXG4gIGRyb3A6IChhbHRLZXkpIC0+XG4gICAgY2hlY2twb2ludEJlZm9yZSA9IEBlZGl0b3IuY3JlYXRlQ2hlY2twb2ludCgpXG4gICAgaWYgbm90IGFsdEtleSB0aGVuIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlLCAnJ1xuICAgIGN1cnNvclBvcyA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLm1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBbY3Vyc29yUG9zLCBjdXJzb3JQb3NdLCBAdGV4dFxuICAgIEBlZGl0b3IuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50IGNoZWNrcG9pbnRCZWZvcmVcblxuICBjbGVhcjogKGFsdEtleSkgLT5cbiAgICBpZiBhbHRLZXk/IGFuZCBAaXNEcmFnZ2luZyB0aGVuIEBkcm9wIGFsdEtleVxuICAgIEBtb3VzZUlzRG93biA9IEBpc0RyYWdnaW5nID0gbm9cbiAgICBAbWFya2VyPy5kZXN0cm95KClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBjbGVhcigpXG4gICAgQGxpbmVzU3Vicz8uZGlzcG9zZSgpXG4gICAgQHN1YnMuZGlzcG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNpbXBsZURyYWdEcm9wVGV4dFxuIl19
