
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9zaW1wbGUtZHJhZy1kcm9wLXRleHQvbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBOzs7O0FBQUE7QUFBQSxNQUFBOztFQUlBLE9BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7RUFFSjs7O2lDQUNKLE1BQUEsR0FDRTtNQUFBLE9BQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxNQURUO1FBRUEsV0FBQSxFQUFhLHFDQUZiO1FBR0EsQ0FBQSxJQUFBLENBQUEsRUFBTSxDQUFDLEtBQUQsRUFBUSxNQUFSLEVBQWdCLE1BQWhCLENBSE47T0FERjs7O2lDQU1GLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJO01BRVosSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENBQVUsTUFBVixFQUFrQixTQUFsQixFQUE2QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsQ0FBRDtVQUFPLElBQUcsS0FBQyxDQUFBLFdBQUo7bUJBQXFCLEtBQUMsQ0FBQSxLQUFELENBQU8sQ0FBRSxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwrQkFBaEIsQ0FBQSxHQUFpRCxLQUFqRCxDQUFULEVBQXJCOztRQUFQO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QjtNQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBeUMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7aUJBQVksS0FBQyxDQUFBLFNBQUQsQ0FBQTtRQUFaO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QyxDQUFWO2FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFOLENB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QU4sRUFBaEM7O01BQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsVUFBRCxHQUFjOzhDQUN0QixDQUFFLE9BQVQsQ0FBQTtJQUhLOztpQ0FLUCxVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBOztXQUNVLENBQUUsT0FBWixDQUFBOzthQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBO0lBSFU7Ozs7OztFQUtkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUk7QUFsRnJCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIyNcbiAgbGliL3NpbXBsZS1kcmFnLWRyb3AtdGV4dC5jb2ZmZWVcbiMjI1xuXG5TdWJBdG9tID0gcmVxdWlyZSAnc3ViLWF0b20nXG5cbmNsYXNzIFNpbXBsZURyYWdEcm9wVGV4dFxuICBjb25maWc6XG4gICAgY29weUtleTpcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnY3RybCdcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VsZWN0IG1vZGlmaWVyIGtleSBmb3IgY29weSBhY3Rpb24nXG4gICAgICBlbnVtOiBbJ2FsdCcsICdjdHJsJywgJ21ldGEnXVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzdWJzID0gbmV3IFN1YkF0b21cblxuICAgIEBzdWJzLmFkZCAnYm9keScsICdtb3VzZXVwJywgKGUpID0+IGlmIEBtb3VzZUlzRG93biB0aGVuIEBjbGVhciBlW2F0b20uY29uZmlnLmdldCgnc2ltcGxlLWRyYWctZHJvcC10ZXh0LmNvcHlLZXknKSsnS2V5J11cbiAgICBAc3Vicy5hZGQgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzICAgICAgICAoZWRpdG9yKSA9PiBAc2V0RWRpdG9yKClcbiAgICBAc3Vicy5hZGQgYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbSAoZWRpdG9yKSA9PiBAc2V0RWRpdG9yKClcblxuICBzZXRFZGl0b3I6IC0+XG4gICAgcHJvY2Vzcy5uZXh0VGljayA9PlxuICAgICAgaWYgbm90IChAZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgICBAY2xlYXIoKVxuICAgICAgICByZXR1cm5cblxuICAgICAgQGxpbmVzU3Vicz8uZGlzcG9zZSgpXG4gICAgICBAdmlld3MgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcbiAgICAgIEBsaW5lcyA9IEB2aWV3cy5xdWVyeVNlbGVjdG9yICcubGluZXMnXG4gICAgICBAbGluZXNTdWJzID0gbmV3IFN1YkF0b21cbiAgICAgIEBsaW5lc1N1YnMuYWRkIEBsaW5lcywgJ21vdXNlZG93bicsIChlKSA9PiBAbW91c2Vkb3duIGVcbiAgICAgIEBsaW5lc1N1YnMuYWRkIEBsaW5lcywgJ21vdXNlbW92ZScsIChlKSA9PlxuICAgICAgICBpZiBAbW91c2VJc0Rvd24gYW5kIGUud2hpY2ggPiAwIHRoZW4gQGRyYWcoKSBlbHNlIEBjbGVhcigpXG5cbiAgbW91c2Vkb3duOiAoZSkgLT5cbiAgICBpZiBub3QgQGVkaXRvciB0aGVuIEBjbGVhcigpOyByZXR1cm5cblxuICAgIEBzZWxNYXJrZXIgPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5tYXJrZXJcbiAgICBAc2VsQnVmZmVyUmFuZ2UgPSBAc2VsTWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICBpZiBAc2VsQnVmZmVyUmFuZ2UuaXNFbXB0eSgpIHRoZW4gcmV0dXJuXG5cbiAgICBpblNlbGVjdGlvbiA9IG5vXG5cbiAgICBAaGlnaGxpZ2h0cyA9IEB2aWV3cy5xdWVyeVNlbGVjdG9yICcuaGlnaGxpZ2h0cydcblxuICAgIEBoaWdobGlnaHRzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5oaWdobGlnaHQuc2VsZWN0aW9uIC5yZWdpb24nKS5mb3JFYWNoIChlbGUpID0+XG4gICAgICB7bGVmdCwgdG9wLCByaWdodCwgYm90dG9tfSA9IGVsZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgaWYgbGVmdCA8PSBlLnBhZ2VYIDwgcmlnaHQgYW5kXG4gICAgICAgICAgdG9wIDw9IGUucGFnZVkgPCBib3R0b21cbiAgICAgICAgaW5TZWxlY3Rpb24gPSB5ZXNcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgaWYgbm90IGluU2VsZWN0aW9uIHRoZW4gcmV0dXJuXG5cbiAgICBAdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UgQHNlbEJ1ZmZlclJhbmdlXG4gICAgQG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclJhbmdlIEBzZWxCdWZmZXJSYW5nZSwgQHNlbE1hcmtlci5nZXRQcm9wZXJ0aWVzKClcbiAgICBAZWRpdG9yLmRlY29yYXRlTWFya2VyIEBtYXJrZXIsIHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogJ3NlbGVjdGlvbidcblxuICAgIEBtb3VzZUlzRG93biA9IHllc1xuXG4gIGRyYWc6IC0+XG4gICAgQGlzRHJhZ2dpbmcgPSB5ZXNcbiAgICBzZWxlY3Rpb24gPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgIHByb2Nlc3MubmV4dFRpY2sgLT4gc2VsZWN0aW9uLmNsZWFyKClcblxuICBkcm9wOiAoYWx0S2V5KSAtPlxuICAgIGNoZWNrcG9pbnRCZWZvcmUgPSBAZWRpdG9yLmNyZWF0ZUNoZWNrcG9pbnQoKVxuICAgIGlmIG5vdCBhbHRLZXkgdGhlbiBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlIEBzZWxCdWZmZXJSYW5nZSwgJydcbiAgICBjdXJzb3JQb3MgPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5tYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UgW2N1cnNvclBvcywgY3Vyc29yUG9zXSwgQHRleHRcbiAgICBAZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludCBjaGVja3BvaW50QmVmb3JlXG5cbiAgY2xlYXI6IChhbHRLZXkpIC0+XG4gICAgaWYgYWx0S2V5PyBhbmQgQGlzRHJhZ2dpbmcgdGhlbiBAZHJvcCBhbHRLZXlcbiAgICBAbW91c2VJc0Rvd24gPSBAaXNEcmFnZ2luZyA9IG5vXG4gICAgQG1hcmtlcj8uZGVzdHJveSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAY2xlYXIoKVxuICAgIEBsaW5lc1N1YnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzLmRpc3Bvc2UoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTaW1wbGVEcmFnRHJvcFRleHRcbiJdfQ==
