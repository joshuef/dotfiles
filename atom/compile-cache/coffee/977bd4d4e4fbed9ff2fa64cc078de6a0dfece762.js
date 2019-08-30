
/*
  lib/simple-drag-drop-text.coffee
 */

(function() {
  var SimpleDragDropText, SubAtom;

  SubAtom = require('sub-atom');

  SimpleDragDropText = (function() {
    function SimpleDragDropText() {}

    SimpleDragDropText.prototype.config = {
      copyKey: {
        type: 'string',
        "default": 'ctrl',
        description: 'Select modifier key for copy action',
        "enum": ['alt', 'ctrl', 'meta']
      },
      delay: {
        type: 'integer',
        "default": 500,
        minimum: 1,
        description: 'Hold click for this duration to enable drag'
      }
    };

    SimpleDragDropText.prototype.activate = function() {
      this.subs = new SubAtom;
      this.canDrag = false;
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
          _this.userDelay = atom.config.get('simple-drag-drop-text.delay') || 500;
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
            if (_this.mouseIsDown && _this.canDrag && e.which > 0) {
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
      this.highlights = this.views.querySelector('.highlights');
      this.highlights.querySelectorAll('.highlight.selection .region').forEach((function(_this) {
        return function(ele) {
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
      this.mouseIsDown = true;
      return setTimeout(((function(_this) {
        return function() {
          return _this.canDrag = true;
        };
      })(this)), this.userDelay);
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
      this.mouseIsDown = this.isDragging = this.canDrag = false;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9zaW1wbGUtZHJhZy1kcm9wLXRleHQvbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBOzs7O0FBQUE7QUFBQSxNQUFBOztFQUlBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7RUFFSjs7O2lDQUNKLE1BQUEsR0FDRTtNQUFBLE9BQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxNQURUO1FBRUEsV0FBQSxFQUFhLHFDQUZiO1FBR0EsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLEtBQUQsRUFBUSxNQUFSLEVBQWdCLE1BQWhCLENBSE47T0FERjtNQUtBLEtBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxHQURUO1FBRUEsT0FBQSxFQUFTLENBRlQ7UUFHQSxXQUFBLEVBQWEsNkNBSGI7T0FORjs7O2lDQVdGLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJO01BQ1osSUFBQyxDQUFBLE9BQUQsR0FBVztNQUVYLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLE1BQVYsRUFBa0IsU0FBbEIsRUFBNkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLENBQUQ7VUFBTyxJQUFHLEtBQUMsQ0FBQSxXQUFKO21CQUFxQixLQUFDLENBQUEsS0FBRCxDQUFPLENBQUUsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsK0JBQWhCLENBQUEsR0FBaUQsS0FBakQsQ0FBVCxFQUFyQjs7UUFBUDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQU4sQ0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFm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QUE2QixJQUFDLENBQUEsY0FBOUIsRUFBOEMsRUFBOUMsRUFBbkI7O01BQ0EsU0FBQSxHQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUEwQixDQUFDLE1BQU0sQ0FBQyxjQUFsQyxDQUFBLENBQWtELENBQUM7TUFDL0QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixDQUFDLFNBQUQsRUFBWSxTQUFaLENBQTdCLEVBQXFELElBQUMsQ0FBQSxJQUF0RDthQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsMkJBQVIsQ0FBb0MsZ0JBQXBDO0lBTEk7O2lDQU9OLEtBQUEsR0FBTyxTQUFDLE1BQUQ7QUFDTCxVQUFBO01BQUEsSUFBRyxnQkFBQSxJQUFZLElBQUMsQ0FBQSxVQUFoQjtRQUFnQyxJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFBaEM7O01BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxPQUFELEdBQVc7OENBQ2pDLENBQUUsT0FBVCxDQUFBO0lBSEs7O2lDQUtQLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7O1dBQ1UsQ0FBRSxPQUFaLENBQUE7O2FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7SUFIVTs7Ozs7O0VBS2QsTUFBTSxDQUFDLE9BQVAsR0FBaUIsSUFBSTtBQTFGckIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMjI1xuICBsaWIvc2ltcGxlLWRyYWctZHJvcC10ZXh0LmNvZmZlZVxuIyMjXG5cblN1YkF0b20gPSByZXF1aXJlICdzdWItYXRvbSdcblxuY2xhc3MgU2ltcGxlRHJhZ0Ryb3BUZXh0XG4gIGNvbmZpZzpcbiAgICBjb3B5S2V5OlxuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdjdHJsJ1xuICAgICAgZGVzY3JpcHRpb246ICdTZWxlY3QgbW9kaWZpZXIga2V5IGZvciBjb3B5IGFjdGlvbidcbiAgICAgIGVudW06IFsnYWx0JywgJ2N0cmwnLCAnbWV0YSddXG4gICAgZGVsYXk6XG4gICAgICB0eXBlOiAnaW50ZWdlcidcbiAgICAgIGRlZmF1bHQ6IDUwMFxuICAgICAgbWluaW11bTogMVxuICAgICAgZGVzY3JpcHRpb246ICdIb2xkIGNsaWNrIGZvciB0aGlzIGR1cmF0aW9uIHRvIGVuYWJsZSBkcmFnJ1xuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzdWJzID0gbmV3IFN1YkF0b21cbiAgICBAY2FuRHJhZyA9IG5vXG5cbiAgICBAc3Vicy5hZGQgJ2JvZHknLCAnbW91c2V1cCcsIChlKSA9PiBpZiBAbW91c2VJc0Rvd24gdGhlbiBAY2xlYXIgZVthdG9tLmNvbmZpZy5nZXQoJ3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb3B5S2V5JykrJ0tleSddXG4gICAgQHN1YnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAgICAgICAgKGVkaXRvcikgPT4gQHNldEVkaXRvcigpXG4gICAgQHN1YnMuYWRkIGF0b20ud29ya3NwYWNlLm9uRGlkQ2hhbmdlQWN0aXZlUGFuZUl0ZW0gKGVkaXRvcikgPT4gQHNldEVkaXRvcigpXG5cbiAgc2V0RWRpdG9yOiAtPlxuICAgIHByb2Nlc3MubmV4dFRpY2sgPT5cbiAgICAgIGlmIG5vdCAoQGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgICAgQGNsZWFyKClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIEB1c2VyRGVsYXkgPSBhdG9tLmNvbmZpZy5nZXQoJ3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5kZWxheScpIG9yIDUwMFxuICAgICAgQGxpbmVzU3Vicz8uZGlzcG9zZSgpXG4gICAgICBAdmlld3MgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcbiAgICAgIEBsaW5lcyA9IEB2aWV3cy5xdWVyeVNlbGVjdG9yICcubGluZXMnXG4gICAgICBAbGluZXNTdWJzID0gbmV3IFN1YkF0b21cbiAgICAgIEBsaW5lc1N1YnMuYWRkIEBsaW5lcywgJ21vdXNlZG93bicsIChlKSA9PiBAbW91c2Vkb3duIGVcbiAgICAgIEBsaW5lc1N1YnMuYWRkIEBsaW5lcywgJ21vdXNlbW92ZScsIChlKSA9PlxuICAgICAgICBpZiBAbW91c2VJc0Rvd24gYW5kIEBjYW5EcmFnIGFuZCBlLndoaWNoID4gMCB0aGVuIEBkcmFnKCkgZWxzZSBAY2xlYXIoKVxuXG4gIG1vdXNlZG93bjogKGUpIC0+XG4gICAgaWYgbm90IEBlZGl0b3IgdGhlbiBAY2xlYXIoKTsgcmV0dXJuXG5cbiAgICBAc2VsTWFya2VyID0gQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkubWFya2VyXG4gICAgQHNlbEJ1ZmZlclJhbmdlID0gQHNlbE1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaWYgQHNlbEJ1ZmZlclJhbmdlLmlzRW1wdHkoKSB0aGVuIHJldHVyblxuXG4gICAgaW5TZWxlY3Rpb24gPSBub1xuXG4gICAgQGhpZ2hsaWdodHMgPSBAdmlld3MucXVlcnlTZWxlY3RvciAnLmhpZ2hsaWdodHMnXG5cbiAgICBAaGlnaGxpZ2h0cy5xdWVyeVNlbGVjdG9yQWxsKCcuaGlnaGxpZ2h0LnNlbGVjdGlvbiAucmVnaW9uJykuZm9yRWFjaCAoZWxlKSA9PlxuICAgICAge2xlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbX0gPSBlbGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGlmIGxlZnQgPD0gZS5wYWdlWCA8IHJpZ2h0IGFuZFxuICAgICAgICAgIHRvcCA8PSBlLnBhZ2VZIDwgYm90dG9tXG4gICAgICAgIGluU2VsZWN0aW9uID0geWVzXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIGlmIG5vdCBpblNlbGVjdGlvbiB0aGVuIHJldHVyblxuXG4gICAgQHRleHQgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlIEBzZWxCdWZmZXJSYW5nZVxuICAgIEBtYXJrZXIgPSBAZWRpdG9yLm1hcmtCdWZmZXJSYW5nZSBAc2VsQnVmZmVyUmFuZ2UsIEBzZWxNYXJrZXIuZ2V0UHJvcGVydGllcygpXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlciBAbWFya2VyLCB0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICdzZWxlY3Rpb24nXG5cbiAgICBAbW91c2VJc0Rvd24gPSB5ZXNcbiAgICBzZXRUaW1lb3V0KCg9PiBAY2FuRHJhZyA9IHllcyksIEB1c2VyRGVsYXkpXG5cbiAgZHJhZzogLT5cbiAgICBAaXNEcmFnZ2luZyA9IHllc1xuICAgIHNlbGVjdGlvbiA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpXG4gICAgcHJvY2Vzcy5uZXh0VGljayAtPiBzZWxlY3Rpb24uY2xlYXIoKVxuXG4gIGRyb3A6IChhbHRLZXkpIC0+XG4gICAgY2hlY2twb2ludEJlZm9yZSA9IEBlZGl0b3IuY3JlYXRlQ2hlY2twb2ludCgpXG4gICAgaWYgbm90IGFsdEtleSB0aGVuIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlLCAnJ1xuICAgIGN1cnNvclBvcyA9IEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLm1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBbY3Vyc29yUG9zLCBjdXJzb3JQb3NdLCBAdGV4dFxuICAgIEBlZGl0b3IuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50IGNoZWNrcG9pbnRCZWZvcmVcblxuICBjbGVhcjogKGFsdEtleSkgLT5cbiAgICBpZiBhbHRLZXk/IGFuZCBAaXNEcmFnZ2luZyB0aGVuIEBkcm9wIGFsdEtleVxuICAgIEBtb3VzZUlzRG93biA9IEBpc0RyYWdnaW5nID0gQGNhbkRyYWcgPSBub1xuICAgIEBtYXJrZXI/LmRlc3Ryb3koKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQGNsZWFyKClcbiAgICBAbGluZXNTdWJzPy5kaXNwb3NlKClcbiAgICBAc3Vicy5kaXNwb3NlKClcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgU2ltcGxlRHJhZ0Ryb3BUZXh0XG4iXX0=
