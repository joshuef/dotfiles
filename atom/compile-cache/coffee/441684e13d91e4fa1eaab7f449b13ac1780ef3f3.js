(function() {
  var Color, ColorMarker, ColorMarkerElement, click, path, stylesheet, stylesheetPath;

  path = require('path');

  Color = require('../lib/color');

  ColorMarker = require('../lib/color-marker');

  ColorMarkerElement = require('../lib/color-marker-element');

  click = require('./helpers/events').click;

  stylesheetPath = path.resolve(__dirname, '..', 'styles', 'pigments.less');

  stylesheet = atom.themes.loadStylesheet(stylesheetPath);

  describe('ColorMarkerElement', function() {
    var colorMarker, colorMarkerElement, editor, jasmineContent, marker, ref;
    ref = [], editor = ref[0], marker = ref[1], colorMarker = ref[2], colorMarkerElement = ref[3], jasmineContent = ref[4];
    beforeEach(function() {
      var color, styleNode, text;
      jasmineContent = document.body.querySelector('#jasmine-content');
      styleNode = document.createElement('style');
      styleNode.textContent = "" + stylesheet;
      jasmineContent.appendChild(styleNode);
      editor = atom.workspace.buildTextEditor({});
      editor.setText("body {\n  color: #f00;\n  bar: foo;\n  foo: bar;\n}");
      marker = editor.markBufferRange([[1, 9], [4, 1]], {
        invalidate: 'touch'
      });
      color = new Color('#ff0000');
      text = '#f00';
      return colorMarker = new ColorMarker({
        marker: marker,
        color: color,
        text: text,
        colorBuffer: {
          editor: editor,
          useNativeDecorations: function() {
            return false;
          },
          selectColorMarkerAndOpenPicker: jasmine.createSpy('select-color'),
          ignoredScopes: [],
          findValidColorMarkers: function() {
            return [];
          }
        }
      });
    });
    it('releases itself when the marker is destroyed', function() {
      var eventSpy;
      colorMarkerElement = new ColorMarkerElement;
      colorMarkerElement.setContainer({
        editor: editor,
        useNativeDecorations: function() {
          return false;
        },
        requestMarkerUpdate: function(arg) {
          var marker;
          marker = arg[0];
          return marker.render();
        }
      });
      colorMarkerElement.setModel(colorMarker);
      eventSpy = jasmine.createSpy('did-release');
      colorMarkerElement.onDidRelease(eventSpy);
      spyOn(colorMarkerElement, 'release').andCallThrough();
      marker.destroy();
      expect(colorMarkerElement.release).toHaveBeenCalled();
      return expect(eventSpy).toHaveBeenCalled();
    });
    describe('clicking on the decoration', function() {
      beforeEach(function() {
        colorMarkerElement = new ColorMarkerElement;
        colorMarkerElement.setContainer({
          editor: editor,
          useNativeDecorations: function() {
            return false;
          },
          requestMarkerUpdate: function(arg) {
            var marker;
            marker = arg[0];
            return marker.render();
          }
        });
        colorMarkerElement.setModel(colorMarker);
        return click(colorMarkerElement);
      });
      return it('calls selectColorMarkerAndOpenPicker on the buffer', function() {
        return expect(colorMarker.colorBuffer.selectColorMarkerAndOpenPicker).toHaveBeenCalled();
      });
    });
    describe('when the render mode is set to background', function() {
      var regions;
      regions = [][0];
      beforeEach(function() {
        ColorMarkerElement.setMarkerType('background');
        colorMarkerElement = new ColorMarkerElement;
        colorMarkerElement.setContainer({
          editor: editor,
          useNativeDecorations: function() {
            return false;
          },
          requestMarkerUpdate: function(arg) {
            var marker;
            marker = arg[0];
            return marker.render();
          }
        });
        colorMarkerElement.setModel(colorMarker);
        return regions = colorMarkerElement.querySelectorAll('.region.background');
      });
      it('creates a region div for the color', function() {
        return expect(regions.length).toEqual(4);
      });
      it('fills the region with the covered text', function() {
        expect(regions[0].textContent).toEqual('#f00;');
        expect(regions[1].textContent).toEqual('  bar: foo;');
        expect(regions[2].textContent).toEqual('  foo: bar;');
        return expect(regions[3].textContent).toEqual('}');
      });
      it('sets the background of the region with the color css value', function() {
        var i, len, region, results;
        results = [];
        for (i = 0, len = regions.length; i < len; i++) {
          region = regions[i];
          results.push(expect(region.style.backgroundColor).toEqual('rgb(255, 0, 0)'));
        }
        return results;
      });
      describe('when the marker is modified', function() {
        beforeEach(function() {
          spyOn(colorMarkerElement.renderer, 'render').andCallThrough();
          editor.moveToTop();
          return editor.insertText('\n\n');
        });
        return it('renders again the marker content', function() {
          expect(colorMarkerElement.renderer.render).toHaveBeenCalled();
          return expect(colorMarkerElement.querySelectorAll('.region').length).toEqual(4);
        });
      });
      return describe('when released', function() {
        return it('removes all the previously rendered content', function() {
          colorMarkerElement.release();
          return expect(colorMarkerElement.children.length).toEqual(0);
        });
      });
    });
    describe('when the render mode is set to outline', function() {
      var regions;
      regions = [][0];
      beforeEach(function() {
        ColorMarkerElement.setMarkerType('outline');
        colorMarkerElement = new ColorMarkerElement;
        colorMarkerElement.setContainer({
          editor: editor,
          useNativeDecorations: function() {
            return false;
          },
          requestMarkerUpdate: function(arg) {
            var marker;
            marker = arg[0];
            return marker.render();
          }
        });
        colorMarkerElement.setModel(colorMarker);
        return regions = colorMarkerElement.querySelectorAll('.region.outline');
      });
      it('creates a region div for the color', function() {
        return expect(regions.length).toEqual(4);
      });
      it('fills the region with the covered text', function() {
        expect(regions[0].textContent).toEqual('');
        expect(regions[1].textContent).toEqual('');
        expect(regions[2].textContent).toEqual('');
        return expect(regions[3].textContent).toEqual('');
      });
      it('sets the drop shadow color of the region with the color css value', function() {
        var i, len, region, results;
        results = [];
        for (i = 0, len = regions.length; i < len; i++) {
          region = regions[i];
          results.push(expect(region.style.borderColor).toEqual('rgb(255, 0, 0)'));
        }
        return results;
      });
      describe('when the marker is modified', function() {
        beforeEach(function() {
          spyOn(colorMarkerElement.renderer, 'render').andCallThrough();
          editor.moveToTop();
          return editor.insertText('\n\n');
        });
        return it('renders again the marker content', function() {
          expect(colorMarkerElement.renderer.render).toHaveBeenCalled();
          return expect(colorMarkerElement.querySelectorAll('.region').length).toEqual(4);
        });
      });
      return describe('when released', function() {
        return it('removes all the previously rendered content', function() {
          colorMarkerElement.release();
          return expect(colorMarkerElement.children.length).toEqual(0);
        });
      });
    });
    describe('when the render mode is set to underline', function() {
      var regions;
      regions = [][0];
      beforeEach(function() {
        ColorMarkerElement.setMarkerType('underline');
        colorMarkerElement = new ColorMarkerElement;
        colorMarkerElement.setContainer({
          editor: editor,
          useNativeDecorations: function() {
            return false;
          },
          requestMarkerUpdate: function(arg) {
            var marker;
            marker = arg[0];
            return marker.render();
          }
        });
        colorMarkerElement.setModel(colorMarker);
        return regions = colorMarkerElement.querySelectorAll('.region.underline');
      });
      it('creates a region div for the color', function() {
        return expect(regions.length).toEqual(4);
      });
      it('fills the region with the covered text', function() {
        expect(regions[0].textContent).toEqual('');
        expect(regions[1].textContent).toEqual('');
        expect(regions[2].textContent).toEqual('');
        return expect(regions[3].textContent).toEqual('');
      });
      it('sets the background of the region with the color css value', function() {
        var i, len, region, results;
        results = [];
        for (i = 0, len = regions.length; i < len; i++) {
          region = regions[i];
          results.push(expect(region.style.backgroundColor).toEqual('rgb(255, 0, 0)'));
        }
        return results;
      });
      describe('when the marker is modified', function() {
        beforeEach(function() {
          spyOn(colorMarkerElement.renderer, 'render').andCallThrough();
          editor.moveToTop();
          return editor.insertText('\n\n');
        });
        return it('renders again the marker content', function() {
          expect(colorMarkerElement.renderer.render).toHaveBeenCalled();
          return expect(colorMarkerElement.querySelectorAll('.region').length).toEqual(4);
        });
      });
      return describe('when released', function() {
        return it('removes all the previously rendered content', function() {
          colorMarkerElement.release();
          return expect(colorMarkerElement.children.length).toEqual(0);
        });
      });
    });
    describe('when the render mode is set to dot', function() {
      var createMarker, markerElement, markers, markersElements, ref1, regions;
      ref1 = [], regions = ref1[0], markers = ref1[1], markersElements = ref1[2], markerElement = ref1[3];
      createMarker = function(range, color, text) {
        marker = editor.markBufferRange(range, {
          invalidate: 'touch'
        });
        color = new Color(color);
        text = text;
        return colorMarker = new ColorMarker({
          marker: marker,
          color: color,
          text: text,
          colorBuffer: {
            editor: editor,
            useNativeDecorations: function() {
              return false;
            },
            project: {
              colorPickerAPI: {
                open: jasmine.createSpy('color-picker.open')
              }
            },
            ignoredScopes: [],
            findValidColorMarkers: function() {
              return [];
            }
          }
        });
      };
      beforeEach(function() {
        var editorElement;
        editor = atom.workspace.buildTextEditor({});
        editor.setText("body {\n  background: red, green, blue;\n}");
        editorElement = atom.views.getView(editor);
        jasmineContent.appendChild(editorElement);
        markers = [createMarker([[1, 13], [1, 16]], '#ff0000', 'red'), createMarker([[1, 18], [1, 23]], '#00ff00', 'green'), createMarker([[1, 25], [1, 29]], '#0000ff', 'blue')];
        ColorMarkerElement.setMarkerType('dot');
        return markersElements = markers.map(function(colorMarker) {
          colorMarkerElement = new ColorMarkerElement;
          colorMarkerElement.setContainer({
            editor: editor,
            useNativeDecorations: function() {
              return false;
            },
            requestMarkerUpdate: function(arg) {
              var marker;
              marker = arg[0];
              return marker.render();
            }
          });
          colorMarkerElement.setModel(colorMarker);
          jasmineContent.appendChild(colorMarkerElement);
          return colorMarkerElement;
        });
      });
      return it('adds the dot class on the marker', function() {
        var i, len, markersElement, results;
        results = [];
        for (i = 0, len = markersElements.length; i < len; i++) {
          markersElement = markersElements[i];
          results.push(expect(markersElement.classList.contains('dot')).toBeTruthy());
        }
        return results;
      });
    });
    return describe('when the render mode is set to dot', function() {
      var createMarker, markers, markersElements, ref1, regions;
      ref1 = [], regions = ref1[0], markers = ref1[1], markersElements = ref1[2];
      createMarker = function(range, color, text) {
        marker = editor.markBufferRange(range, {
          invalidate: 'touch'
        });
        color = new Color(color);
        text = text;
        return colorMarker = new ColorMarker({
          marker: marker,
          color: color,
          text: text,
          colorBuffer: {
            editor: editor,
            useNativeDecorations: function() {
              return false;
            },
            project: {
              colorPickerAPI: {
                open: jasmine.createSpy('color-picker.open')
              }
            },
            ignoredScopes: [],
            findValidColorMarkers: function() {
              return [];
            }
          }
        });
      };
      beforeEach(function() {
        var editorElement;
        editor = atom.workspace.buildTextEditor({});
        editor.setText("body {\n  background: red, green, blue;\n}");
        editorElement = atom.views.getView(editor);
        jasmineContent.appendChild(editorElement);
        markers = [createMarker([[1, 13], [1, 16]], '#ff0000', 'red'), createMarker([[1, 18], [1, 23]], '#00ff00', 'green'), createMarker([[1, 25], [1, 29]], '#0000ff', 'blue')];
        ColorMarkerElement.setMarkerType('square-dot');
        return markersElements = markers.map(function(colorMarker) {
          colorMarkerElement = new ColorMarkerElement;
          colorMarkerElement.setContainer({
            editor: editor,
            useNativeDecorations: function() {
              return false;
            },
            requestMarkerUpdate: function(arg) {
              var marker;
              marker = arg[0];
              return marker.render();
            }
          });
          colorMarkerElement.setModel(colorMarker);
          jasmineContent.appendChild(colorMarkerElement);
          return colorMarkerElement;
        });
      });
      return it('adds the dot class on the marker', function() {
        var i, len, markersElement, results;
        results = [];
        for (i = 0, len = markersElements.length; i < len; i++) {
          markersElement = markersElements[i];
          expect(markersElement.classList.contains('dot')).toBeTruthy();
          results.push(expect(markersElement.classList.contains('square')).toBeTruthy());
        }
        return results;
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1tYXJrZXItZWxlbWVudC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEsY0FBUjs7RUFDUixXQUFBLEdBQWMsT0FBQSxDQUFRLHFCQUFSOztFQUNkLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSw2QkFBUjs7RUFDcEIsUUFBUyxPQUFBLENBQVEsa0JBQVI7O0VBRVYsY0FBQSxHQUFpQixJQUFJLENBQUMsT0FBTCxDQUFhLFNBQWIsRUFBd0IsSUFBeEIsRUFBOEIsUUFBOUIsRUFBd0MsZUFBeEM7O0VBQ2pCLFVBQUEsR0FBYSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQVosQ0FBMkIsY0FBM0I7O0VBRWIsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7QUFDN0IsUUFBQTtJQUFBLE1BQW9FLEVBQXBFLEVBQUMsZUFBRCxFQUFTLGVBQVQsRUFBaUIsb0JBQWpCLEVBQThCLDJCQUE5QixFQUFrRDtJQUVsRCxVQUFBLENBQVcsU0FBQTtBQUNULFVBQUE7TUFBQSxjQUFBLEdBQWlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBZCxDQUE0QixrQkFBNUI7TUFFakIsU0FBQSxHQUFZLFFBQVEsQ0FBQyxhQUFULENBQXVCLE9BQXZCO01BQ1osU0FBUyxDQUFDLFdBQVYsR0FBd0IsRUFBQSxHQUNwQjtNQUdKLGNBQWMsQ0FBQyxXQUFmLENBQTJCLFNBQTNCO01BRUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZixDQUErQixFQUEvQjtNQUNULE1BQU0sQ0FBQyxPQUFQLENBQWUscURBQWY7TUFPQSxNQUFBLEdBQVMsTUFBTSxDQUFDLGVBQVAsQ0FBdUIsQ0FBQyxDQUFDLENBQUQsRUFB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LEVBQXlDLE1BQXpDLENBSFE7UUFNVixrQkFBa0IsQ0FBQyxhQUFuQixDQUFpQyxZQUFqQztlQUVBLGVBQUEsR0FBa0IsT0FBTyxDQUFDLEdBQVIsQ0FBWSxTQUFDLFdBQUQ7VUFDNUIsa0JBQUEsR0FBcUIsSUFBSTtVQUN6QixrQkFBa0IsQ0FBQyxZQUFuQixDQUNFO1lBQUEsTUFBQSxFQUFRLE1BQVI7WUFDQSxvQkFBQSxFQUFzQixTQUFBO3FCQUFHO1lBQUgsQ0FEdEI7WUFFQSxtQkFBQSxFQUFxQixTQUFDLEdBQUQ7QUFBYyxrQkFBQTtjQUFaLFNBQUQ7cUJBQWEsTUFBTSxDQUFDLE1BQVAsQ0FBQTtZQUFkLENBRnJCO1dBREY7VUFLQSxrQkFBa0IsQ0FBQyxRQUFuQixDQUE0QixXQUE1QjtVQUVBLGNBQWMsQ0FBQyxXQUFmLENBQTJCLGtCQUEzQjtpQkFDQTtRQVY0QixDQUFaO01BbkJULENBQVg7YUErQkEsRUFBQSxDQUFHLGtDQUFILEVBQXVDLFNBQUE7QUFDckMsWUFBQTtBQUFBO2FBQUEsaURBQUE7O1VBQ0UsTUFBQSxDQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsUUFBekIsQ0FBa0MsS0FBbEMsQ0FBUCxDQUFnRCxDQUFDLFVBQWpELENBQUE7dUJBQ0EsTUFBQSxDQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUMsUUFBekIsQ0FBa0MsUUFBbEMsQ0FBUCxDQUFtRCxDQUFDLFVBQXBELENBQUE7QUFGRjs7TUFEcUMsQ0FBdkM7SUF4RDZDLENBQS9DO0VBOVM2QixDQUEvQjtBQVRBIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5Db2xvciA9IHJlcXVpcmUgJy4uL2xpYi9jb2xvcidcbkNvbG9yTWFya2VyID0gcmVxdWlyZSAnLi4vbGliL2NvbG9yLW1hcmtlcidcbkNvbG9yTWFya2VyRWxlbWVudCA9IHJlcXVpcmUgJy4uL2xpYi9jb2xvci1tYXJrZXItZWxlbWVudCdcbntjbGlja30gPSByZXF1aXJlICcuL2hlbHBlcnMvZXZlbnRzJ1xuXG5zdHlsZXNoZWV0UGF0aCA9IHBhdGgucmVzb2x2ZSBfX2Rpcm5hbWUsICcuLicsICdzdHlsZXMnLCAncGlnbWVudHMubGVzcydcbnN0eWxlc2hlZXQgPSBhdG9tLnRoZW1lcy5sb2FkU3R5bGVzaGVldChzdHlsZXNoZWV0UGF0aClcblxuZGVzY3JpYmUgJ0NvbG9yTWFya2VyRWxlbWVudCcsIC0+XG4gIFtlZGl0b3IsIG1hcmtlciwgY29sb3JNYXJrZXIsIGNvbG9yTWFya2VyRWxlbWVudCwgamFzbWluZUNvbnRlbnRdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgamFzbWluZUNvbnRlbnQgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJyNqYXNtaW5lLWNvbnRlbnQnKVxuXG4gICAgc3R5bGVOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAgIHN0eWxlTm9kZS50ZXh0Q29udGVudCA9IFwiXCJcIlxuICAgICAgI3tzdHlsZXNoZWV0fVxuICAgIFwiXCJcIlxuXG4gICAgamFzbWluZUNvbnRlbnQuYXBwZW5kQ2hpbGQoc3R5bGVOb2RlKVxuXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuYnVpbGRUZXh0RWRpdG9yKHt9KVxuICAgIGVkaXRvci5zZXRUZXh0KFwiXCJcIlxuICAgIGJvZHkge1xuICAgICAgY29sb3I6ICNmMDA7XG4gICAgICBiYXI6IGZvbztcbiAgICAgIGZvbzogYmFyO1xuICAgIH1cbiAgICBcIlwiXCIpXG4gICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbWzEsOV0sWzQsMV1dLCB7XG4gICAgICBpbnZhbGlkYXRlOiAndG91Y2gnXG4gICAgfSlcbiAgICBjb2xvciA9IG5ldyBDb2xvcignI2ZmMDAwMCcpXG4gICAgdGV4dCA9ICcjZjAwJ1xuXG4gICAgY29sb3JNYXJrZXIgPSBuZXcgQ29sb3JNYXJrZXIoe1xuICAgICAgbWFya2VyXG4gICAgICBjb2xvclxuICAgICAgdGV4dFxuICAgICAgY29sb3JCdWZmZXI6IHtcbiAgICAgICAgZWRpdG9yXG4gICAgICAgIHVzZU5hdGl2ZURlY29yYXRpb25zOiAtPiBmYWxzZVxuICAgICAgICBzZWxlY3RDb2xvck1hcmtlckFuZE9wZW5QaWNrZXI6IGphc21pbmUuY3JlYXRlU3B5KCdzZWxlY3QtY29sb3InKVxuICAgICAgICBpZ25vcmVkU2NvcGVzOiBbXVxuICAgICAgICBmaW5kVmFsaWRDb2xvck1hcmtlcnM6IC0+IFtdXG4gICAgICB9XG4gICAgfSlcblxuICBpdCAncmVsZWFzZXMgaXRzZWxmIHdoZW4gdGhlIG1hcmtlciBpcyBkZXN0cm95ZWQnLCAtPlxuICAgIGNvbG9yTWFya2VyRWxlbWVudCA9IG5ldyBDb2xvck1hcmtlckVsZW1lbnRcbiAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0Q29udGFpbmVyXG4gICAgICBlZGl0b3I6IGVkaXRvclxuICAgICAgdXNlTmF0aXZlRGVjb3JhdGlvbnM6IC0+IGZhbHNlXG4gICAgICByZXF1ZXN0TWFya2VyVXBkYXRlOiAoW21hcmtlcl0pIC0+IG1hcmtlci5yZW5kZXIoKVxuXG4gICAgY29sb3JNYXJrZXJFbGVtZW50LnNldE1vZGVsKGNvbG9yTWFya2VyKVxuXG4gICAgZXZlbnRTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLXJlbGVhc2UnKVxuICAgIGNvbG9yTWFya2VyRWxlbWVudC5vbkRpZFJlbGVhc2UoZXZlbnRTcHkpXG4gICAgc3B5T24oY29sb3JNYXJrZXJFbGVtZW50LCAncmVsZWFzZScpLmFuZENhbGxUaHJvdWdoKClcblxuICAgIG1hcmtlci5kZXN0cm95KClcblxuICAgIGV4cGVjdChjb2xvck1hcmtlckVsZW1lbnQucmVsZWFzZSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgZXhwZWN0KGV2ZW50U3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICBkZXNjcmliZSAnY2xpY2tpbmcgb24gdGhlIGRlY29yYXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudCA9IG5ldyBDb2xvck1hcmtlckVsZW1lbnRcbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudC5zZXRDb250YWluZXJcbiAgICAgICAgZWRpdG9yOiBlZGl0b3JcbiAgICAgICAgdXNlTmF0aXZlRGVjb3JhdGlvbnM6IC0+IGZhbHNlXG4gICAgICAgIHJlcXVlc3RNYXJrZXJVcGRhdGU6IChbbWFya2VyXSkgLT4gbWFya2VyLnJlbmRlcigpXG5cbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudC5zZXRNb2RlbChjb2xvck1hcmtlcilcblxuICAgICAgY2xpY2soY29sb3JNYXJrZXJFbGVtZW50KVxuXG4gICAgaXQgJ2NhbGxzIHNlbGVjdENvbG9yTWFya2VyQW5kT3BlblBpY2tlciBvbiB0aGUgYnVmZmVyJywgLT5cbiAgICAgIGV4cGVjdChjb2xvck1hcmtlci5jb2xvckJ1ZmZlci5zZWxlY3RDb2xvck1hcmtlckFuZE9wZW5QaWNrZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICMjICAgICMjIyMjIyMjICAgICAjIyMgICAgICMjIyMjIyAgIyMgICAgIyNcbiAgIyMgICAgIyMgICAgICMjICAgIyMgIyMgICAjIyAgICAjIyAjIyAgICMjXG4gICMjICAgICMjICAgICAjIyAgIyMgICAjIyAgIyMgICAgICAgIyMgICMjXG4gICMjICAgICMjIyMjIyMjICAjIyAgICAgIyMgIyMgICAgICAgIyMjIyNcbiAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjIyAjIyAgICAgICAjIyAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAjIyAgICAjIyAjIyAgICMjXG4gICMjICAgICMjIyMjIyMjICAjIyAgICAgIyMgICMjIyMjIyAgIyMgICAgIyNcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgcmVuZGVyIG1vZGUgaXMgc2V0IHRvIGJhY2tncm91bmQnLCAtPlxuICAgIFtyZWdpb25zXSA9IFtdXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgQ29sb3JNYXJrZXJFbGVtZW50LnNldE1hcmtlclR5cGUoJ2JhY2tncm91bmQnKVxuXG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQgPSBuZXcgQ29sb3JNYXJrZXJFbGVtZW50XG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0Q29udGFpbmVyXG4gICAgICAgIGVkaXRvcjogZWRpdG9yXG4gICAgICAgIHVzZU5hdGl2ZURlY29yYXRpb25zOiAtPiBmYWxzZVxuICAgICAgICByZXF1ZXN0TWFya2VyVXBkYXRlOiAoW21hcmtlcl0pIC0+IG1hcmtlci5yZW5kZXIoKVxuXG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0TW9kZWwoY29sb3JNYXJrZXIpXG5cbiAgICAgIHJlZ2lvbnMgPSBjb2xvck1hcmtlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJlZ2lvbi5iYWNrZ3JvdW5kJylcblxuICAgIGl0ICdjcmVhdGVzIGEgcmVnaW9uIGRpdiBmb3IgdGhlIGNvbG9yJywgLT5cbiAgICAgIGV4cGVjdChyZWdpb25zLmxlbmd0aCkudG9FcXVhbCg0KVxuXG4gICAgaXQgJ2ZpbGxzIHRoZSByZWdpb24gd2l0aCB0aGUgY292ZXJlZCB0ZXh0JywgLT5cbiAgICAgIGV4cGVjdChyZWdpb25zWzBdLnRleHRDb250ZW50KS50b0VxdWFsKCcjZjAwOycpXG4gICAgICBleHBlY3QocmVnaW9uc1sxXS50ZXh0Q29udGVudCkudG9FcXVhbCgnICBiYXI6IGZvbzsnKVxuICAgICAgZXhwZWN0KHJlZ2lvbnNbMl0udGV4dENvbnRlbnQpLnRvRXF1YWwoJyAgZm9vOiBiYXI7JylcbiAgICAgIGV4cGVjdChyZWdpb25zWzNdLnRleHRDb250ZW50KS50b0VxdWFsKCd9JylcblxuICAgIGl0ICdzZXRzIHRoZSBiYWNrZ3JvdW5kIG9mIHRoZSByZWdpb24gd2l0aCB0aGUgY29sb3IgY3NzIHZhbHVlJywgLT5cbiAgICAgIGZvciByZWdpb24gaW4gcmVnaW9uc1xuICAgICAgICBleHBlY3QocmVnaW9uLnN0eWxlLmJhY2tncm91bmRDb2xvcikudG9FcXVhbCgncmdiKDI1NSwgMCwgMCknKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gdGhlIG1hcmtlciBpcyBtb2RpZmllZCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNweU9uKGNvbG9yTWFya2VyRWxlbWVudC5yZW5kZXJlciwgJ3JlbmRlcicpLmFuZENhbGxUaHJvdWdoKClcbiAgICAgICAgZWRpdG9yLm1vdmVUb1RvcCgpXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCdcXG5cXG4nKVxuXG4gICAgICBpdCAncmVuZGVycyBhZ2FpbiB0aGUgbWFya2VyIGNvbnRlbnQnLCAtPlxuICAgICAgICBleHBlY3QoY29sb3JNYXJrZXJFbGVtZW50LnJlbmRlcmVyLnJlbmRlcikudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIGV4cGVjdChjb2xvck1hcmtlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJlZ2lvbicpLmxlbmd0aCkudG9FcXVhbCg0KVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gcmVsZWFzZWQnLCAtPlxuICAgICAgaXQgJ3JlbW92ZXMgYWxsIHRoZSBwcmV2aW91c2x5IHJlbmRlcmVkIGNvbnRlbnQnLCAtPlxuICAgICAgICBjb2xvck1hcmtlckVsZW1lbnQucmVsZWFzZSgpXG4gICAgICAgIGV4cGVjdChjb2xvck1hcmtlckVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoKS50b0VxdWFsKDApXG5cbiAgIyMgICAgICMjIyMjIyMgICMjICAgICAjIyAjIyMjIyMjIyAjIyAgICAgICAjIyMjICMjICAgICMjICMjIyMjIyMjXG4gICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgICAgIyMgICAgIyMgICAgICAgICMjICAjIyMgICAjIyAjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICAgICMjICAgICMjICAgICAgICAjIyAgIyMjIyAgIyMgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAgICAjIyAgICAjIyAgICAgICAgIyMgICMjICMjICMjICMjIyMjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICAgICMjICAgICMjICAgICAgICAjIyAgIyMgICMjIyMgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAgICAjIyAgICAjIyAgICAgICAgIyMgICMjICAgIyMjICMjXG4gICMjICAgICAjIyMjIyMjICAgIyMjIyMjIyAgICAgIyMgICAgIyMjIyMjIyMgIyMjIyAjIyAgICAjIyAjIyMjIyMjI1xuXG4gIGRlc2NyaWJlICd3aGVuIHRoZSByZW5kZXIgbW9kZSBpcyBzZXQgdG8gb3V0bGluZScsIC0+XG4gICAgW3JlZ2lvbnNdID0gW11cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBDb2xvck1hcmtlckVsZW1lbnQuc2V0TWFya2VyVHlwZSgnb3V0bGluZScpXG5cbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudCA9IG5ldyBDb2xvck1hcmtlckVsZW1lbnRcbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudC5zZXRDb250YWluZXJcbiAgICAgICAgZWRpdG9yOiBlZGl0b3JcbiAgICAgICAgdXNlTmF0aXZlRGVjb3JhdGlvbnM6IC0+IGZhbHNlXG4gICAgICAgIHJlcXVlc3RNYXJrZXJVcGRhdGU6IChbbWFya2VyXSkgLT4gbWFya2VyLnJlbmRlcigpXG5cbiAgICAgIGNvbG9yTWFya2VyRWxlbWVudC5zZXRNb2RlbChjb2xvck1hcmtlcilcblxuICAgICAgcmVnaW9ucyA9IGNvbG9yTWFya2VyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucmVnaW9uLm91dGxpbmUnKVxuXG4gICAgaXQgJ2NyZWF0ZXMgYSByZWdpb24gZGl2IGZvciB0aGUgY29sb3InLCAtPlxuICAgICAgZXhwZWN0KHJlZ2lvbnMubGVuZ3RoKS50b0VxdWFsKDQpXG5cbiAgICBpdCAnZmlsbHMgdGhlIHJlZ2lvbiB3aXRoIHRoZSBjb3ZlcmVkIHRleHQnLCAtPlxuICAgICAgZXhwZWN0KHJlZ2lvbnNbMF0udGV4dENvbnRlbnQpLnRvRXF1YWwoJycpXG4gICAgICBleHBlY3QocmVnaW9uc1sxXS50ZXh0Q29udGVudCkudG9FcXVhbCgnJylcbiAgICAgIGV4cGVjdChyZWdpb25zWzJdLnRleHRDb250ZW50KS50b0VxdWFsKCcnKVxuICAgICAgZXhwZWN0KHJlZ2lvbnNbM10udGV4dENvbnRlbnQpLnRvRXF1YWwoJycpXG5cbiAgICBpdCAnc2V0cyB0aGUgZHJvcCBzaGFkb3cgY29sb3Igb2YgdGhlIHJlZ2lvbiB3aXRoIHRoZSBjb2xvciBjc3MgdmFsdWUnLCAtPlxuICAgICAgZm9yIHJlZ2lvbiBpbiByZWdpb25zXG4gICAgICAgIGV4cGVjdChyZWdpb24uc3R5bGUuYm9yZGVyQ29sb3IpLnRvRXF1YWwoJ3JnYigyNTUsIDAsIDApJylcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBtYXJrZXIgaXMgbW9kaWZpZWQnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzcHlPbihjb2xvck1hcmtlckVsZW1lbnQucmVuZGVyZXIsICdyZW5kZXInKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICAgIGVkaXRvci5tb3ZlVG9Ub3AoKVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnXFxuXFxuJylcblxuICAgICAgaXQgJ3JlbmRlcnMgYWdhaW4gdGhlIG1hcmtlciBjb250ZW50JywgLT5cbiAgICAgICAgZXhwZWN0KGNvbG9yTWFya2VyRWxlbWVudC5yZW5kZXJlci5yZW5kZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoY29sb3JNYXJrZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yZWdpb24nKS5sZW5ndGgpLnRvRXF1YWwoNClcblxuICAgIGRlc2NyaWJlICd3aGVuIHJlbGVhc2VkJywgLT5cbiAgICAgIGl0ICdyZW1vdmVzIGFsbCB0aGUgcHJldmlvdXNseSByZW5kZXJlZCBjb250ZW50JywgLT5cbiAgICAgICAgY29sb3JNYXJrZXJFbGVtZW50LnJlbGVhc2UoKVxuICAgICAgICBleHBlY3QoY29sb3JNYXJrZXJFbGVtZW50LmNoaWxkcmVuLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICMjICAgICMjICAgICAjIyAjIyAgICAjIyAjIyMjIyMjIyAgIyMjIyMjIyMgIyMjIyMjIyNcbiAgIyMgICAgIyMgICAgICMjICMjIyAgICMjICMjICAgICAjIyAjIyAgICAgICAjIyAgICAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjIyMgICMjICMjICAgICAjIyAjIyAgICAgICAjIyAgICAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICMjICMjICMjICAgICAjIyAjIyMjIyMgICAjIyMjIyMjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICMjIyMgIyMgICAgICMjICMjICAgICAgICMjICAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgIyMjICMjICAgICAjIyAjIyAgICAgICAjIyAgICAjI1xuICAjIyAgICAgIyMjIyMjIyAgIyMgICAgIyMgIyMjIyMjIyMgICMjIyMjIyMjICMjICAgICAjI1xuXG4gIGRlc2NyaWJlICd3aGVuIHRoZSByZW5kZXIgbW9kZSBpcyBzZXQgdG8gdW5kZXJsaW5lJywgLT5cbiAgICBbcmVnaW9uc10gPSBbXVxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIENvbG9yTWFya2VyRWxlbWVudC5zZXRNYXJrZXJUeXBlKCd1bmRlcmxpbmUnKVxuXG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQgPSBuZXcgQ29sb3JNYXJrZXJFbGVtZW50XG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0Q29udGFpbmVyXG4gICAgICAgIGVkaXRvcjogZWRpdG9yXG4gICAgICAgIHVzZU5hdGl2ZURlY29yYXRpb25zOiAtPiBmYWxzZVxuICAgICAgICByZXF1ZXN0TWFya2VyVXBkYXRlOiAoW21hcmtlcl0pIC0+IG1hcmtlci5yZW5kZXIoKVxuXG4gICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0TW9kZWwoY29sb3JNYXJrZXIpXG5cbiAgICAgIHJlZ2lvbnMgPSBjb2xvck1hcmtlckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJlZ2lvbi51bmRlcmxpbmUnKVxuXG4gICAgaXQgJ2NyZWF0ZXMgYSByZWdpb24gZGl2IGZvciB0aGUgY29sb3InLCAtPlxuICAgICAgZXhwZWN0KHJlZ2lvbnMubGVuZ3RoKS50b0VxdWFsKDQpXG5cbiAgICBpdCAnZmlsbHMgdGhlIHJlZ2lvbiB3aXRoIHRoZSBjb3ZlcmVkIHRleHQnLCAtPlxuICAgICAgZXhwZWN0KHJlZ2lvbnNbMF0udGV4dENvbnRlbnQpLnRvRXF1YWwoJycpXG4gICAgICBleHBlY3QocmVnaW9uc1sxXS50ZXh0Q29udGVudCkudG9FcXVhbCgnJylcbiAgICAgIGV4cGVjdChyZWdpb25zWzJdLnRleHRDb250ZW50KS50b0VxdWFsKCcnKVxuICAgICAgZXhwZWN0KHJlZ2lvbnNbM10udGV4dENvbnRlbnQpLnRvRXF1YWwoJycpXG5cbiAgICBpdCAnc2V0cyB0aGUgYmFja2dyb3VuZCBvZiB0aGUgcmVnaW9uIHdpdGggdGhlIGNvbG9yIGNzcyB2YWx1ZScsIC0+XG4gICAgICBmb3IgcmVnaW9uIGluIHJlZ2lvbnNcbiAgICAgICAgZXhwZWN0KHJlZ2lvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IpLnRvRXF1YWwoJ3JnYigyNTUsIDAsIDApJylcblxuICAgIGRlc2NyaWJlICd3aGVuIHRoZSBtYXJrZXIgaXMgbW9kaWZpZWQnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzcHlPbihjb2xvck1hcmtlckVsZW1lbnQucmVuZGVyZXIsICdyZW5kZXInKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICAgIGVkaXRvci5tb3ZlVG9Ub3AoKVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnXFxuXFxuJylcblxuICAgICAgaXQgJ3JlbmRlcnMgYWdhaW4gdGhlIG1hcmtlciBjb250ZW50JywgLT5cbiAgICAgICAgZXhwZWN0KGNvbG9yTWFya2VyRWxlbWVudC5yZW5kZXJlci5yZW5kZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgICBleHBlY3QoY29sb3JNYXJrZXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5yZWdpb24nKS5sZW5ndGgpLnRvRXF1YWwoNClcblxuICAgIGRlc2NyaWJlICd3aGVuIHJlbGVhc2VkJywgLT5cbiAgICAgIGl0ICdyZW1vdmVzIGFsbCB0aGUgcHJldmlvdXNseSByZW5kZXJlZCBjb250ZW50JywgLT5cbiAgICAgICAgY29sb3JNYXJrZXJFbGVtZW50LnJlbGVhc2UoKVxuICAgICAgICBleHBlY3QoY29sb3JNYXJrZXJFbGVtZW50LmNoaWxkcmVuLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICMjICAgICMjIyMjIyMjICAgIyMjIyMjIyAgIyMjIyMjIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAgICAjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICAgICMjXG4gICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgICAgIyNcbiAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAgICAjI1xuICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICAgICMjXG4gICMjICAgICMjIyMjIyMjICAgIyMjIyMjIyAgICAgIyNcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgcmVuZGVyIG1vZGUgaXMgc2V0IHRvIGRvdCcsIC0+XG4gICAgW3JlZ2lvbnMsIG1hcmtlcnMsIG1hcmtlcnNFbGVtZW50cywgbWFya2VyRWxlbWVudF0gPSBbXVxuXG4gICAgY3JlYXRlTWFya2VyID0gKHJhbmdlLCBjb2xvciwgdGV4dCkgLT5cbiAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHtcbiAgICAgICAgaW52YWxpZGF0ZTogJ3RvdWNoJ1xuICAgICAgfSlcbiAgICAgIGNvbG9yID0gbmV3IENvbG9yKGNvbG9yKVxuICAgICAgdGV4dCA9IHRleHRcblxuICAgICAgY29sb3JNYXJrZXIgPSBuZXcgQ29sb3JNYXJrZXIoe1xuICAgICAgICBtYXJrZXJcbiAgICAgICAgY29sb3JcbiAgICAgICAgdGV4dFxuICAgICAgICBjb2xvckJ1ZmZlcjoge1xuICAgICAgICAgIGVkaXRvclxuICAgICAgICAgIHVzZU5hdGl2ZURlY29yYXRpb25zOiAtPiBmYWxzZVxuICAgICAgICAgIHByb2plY3Q6XG4gICAgICAgICAgICBjb2xvclBpY2tlckFQSTpcbiAgICAgICAgICAgICAgb3BlbjogamFzbWluZS5jcmVhdGVTcHkoJ2NvbG9yLXBpY2tlci5vcGVuJylcbiAgICAgICAgICBpZ25vcmVkU2NvcGVzOiBbXVxuICAgICAgICAgIGZpbmRWYWxpZENvbG9yTWFya2VyczogLT4gW11cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcih7fSlcbiAgICAgIGVkaXRvci5zZXRUZXh0KFwiXCJcIlxuICAgICAgYm9keSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlZCwgZ3JlZW4sIGJsdWU7XG4gICAgICB9XG4gICAgICBcIlwiXCIpXG5cbiAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgamFzbWluZUNvbnRlbnQuYXBwZW5kQ2hpbGQoZWRpdG9yRWxlbWVudClcblxuICAgICAgbWFya2VycyA9IFtcbiAgICAgICAgY3JlYXRlTWFya2VyIFtbMSwxM10sWzEsMTZdXSwgJyNmZjAwMDAnLCAncmVkJ1xuICAgICAgICBjcmVhdGVNYXJrZXIgW1sxLDE4XSxbMSwyM11dLCAnIzAwZmYwMCcsICdncmVlbidcbiAgICAgICAgY3JlYXRlTWFya2VyIFtbMSwyNV0sWzEsMjldXSwgJyMwMDAwZmYnLCAnYmx1ZSdcbiAgICAgIF1cblxuICAgICAgQ29sb3JNYXJrZXJFbGVtZW50LnNldE1hcmtlclR5cGUoJ2RvdCcpXG5cbiAgICAgIG1hcmtlcnNFbGVtZW50cyA9IG1hcmtlcnMubWFwIChjb2xvck1hcmtlcikgLT5cbiAgICAgICAgY29sb3JNYXJrZXJFbGVtZW50ID0gbmV3IENvbG9yTWFya2VyRWxlbWVudFxuICAgICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0Q29udGFpbmVyXG4gICAgICAgICAgZWRpdG9yOiBlZGl0b3JcbiAgICAgICAgICB1c2VOYXRpdmVEZWNvcmF0aW9uczogLT4gZmFsc2VcbiAgICAgICAgICByZXF1ZXN0TWFya2VyVXBkYXRlOiAoW21hcmtlcl0pIC0+IG1hcmtlci5yZW5kZXIoKVxuXG4gICAgICAgIGNvbG9yTWFya2VyRWxlbWVudC5zZXRNb2RlbChjb2xvck1hcmtlcilcblxuICAgICAgICBqYXNtaW5lQ29udGVudC5hcHBlbmRDaGlsZChjb2xvck1hcmtlckVsZW1lbnQpXG4gICAgICAgIGNvbG9yTWFya2VyRWxlbWVudFxuXG4gICAgaXQgJ2FkZHMgdGhlIGRvdCBjbGFzcyBvbiB0aGUgbWFya2VyJywgLT5cbiAgICAgIGZvciBtYXJrZXJzRWxlbWVudCBpbiBtYXJrZXJzRWxlbWVudHNcbiAgICAgICAgZXhwZWN0KG1hcmtlcnNFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnZG90JykpLnRvQmVUcnV0aHkoKVxuXG4gICMjICAgICAjIyMjIyMgICAjIyMjIyMjICAjIyAgICAgIyMgICAgIyMjICAgICMjIyMjIyMjICAjIyMjIyMjI1xuICAjIyAgICAjIyAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjICAgIyMgIyMgICAjIyAgICAgIyMgIyNcbiAgIyMgICAgIyMgICAgICAgIyMgICAgICMjICMjICAgICAjIyAgIyMgICAjIyAgIyMgICAgICMjICMjXG4gICMjICAgICAjIyMjIyMgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyNcbiAgIyMgICAgICAgICAgIyMgIyMgICMjICMjICMjICAgICAjIyAjIyMjIyMjIyMgIyMgICAjIyAgICMjXG4gICMjICAgICMjICAgICMjICMjICAgICMjICAjIyAgICAgIyMgIyMgICAgICMjICMjICAgICMjICAjI1xuICAjIyAgICAgIyMjIyMjICAgIyMjIyMgIyMgICMjIyMjIyMgICMjICAgICAjIyAjIyAgICAgIyMgIyMjIyMjIyNcblxuICBkZXNjcmliZSAnd2hlbiB0aGUgcmVuZGVyIG1vZGUgaXMgc2V0IHRvIGRvdCcsIC0+XG4gICAgW3JlZ2lvbnMsIG1hcmtlcnMsIG1hcmtlcnNFbGVtZW50c10gPSBbXVxuXG4gICAgY3JlYXRlTWFya2VyID0gKHJhbmdlLCBjb2xvciwgdGV4dCkgLT5cbiAgICAgIG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHtcbiAgICAgICAgaW52YWxpZGF0ZTogJ3RvdWNoJ1xuICAgICAgfSlcbiAgICAgIGNvbG9yID0gbmV3IENvbG9yKGNvbG9yKVxuICAgICAgdGV4dCA9IHRleHRcblxuICAgICAgY29sb3JNYXJrZXIgPSBuZXcgQ29sb3JNYXJrZXIoe1xuICAgICAgICBtYXJrZXJcbiAgICAgICAgY29sb3JcbiAgICAgICAgdGV4dFxuICAgICAgICBjb2xvckJ1ZmZlcjoge1xuICAgICAgICAgIGVkaXRvclxuICAgICAgICAgIHVzZU5hdGl2ZURlY29yYXRpb25zOiAtPiBmYWxzZVxuICAgICAgICAgIHByb2plY3Q6XG4gICAgICAgICAgICBjb2xvclBpY2tlckFQSTpcbiAgICAgICAgICAgICAgb3BlbjogamFzbWluZS5jcmVhdGVTcHkoJ2NvbG9yLXBpY2tlci5vcGVuJylcbiAgICAgICAgICBpZ25vcmVkU2NvcGVzOiBbXVxuICAgICAgICAgIGZpbmRWYWxpZENvbG9yTWFya2VyczogLT4gW11cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmJ1aWxkVGV4dEVkaXRvcih7fSlcbiAgICAgIGVkaXRvci5zZXRUZXh0KFwiXCJcIlxuICAgICAgYm9keSB7XG4gICAgICAgIGJhY2tncm91bmQ6IHJlZCwgZ3JlZW4sIGJsdWU7XG4gICAgICB9XG4gICAgICBcIlwiXCIpXG5cbiAgICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgamFzbWluZUNvbnRlbnQuYXBwZW5kQ2hpbGQoZWRpdG9yRWxlbWVudClcblxuICAgICAgbWFya2VycyA9IFtcbiAgICAgICAgY3JlYXRlTWFya2VyIFtbMSwxM10sWzEsMTZdXSwgJyNmZjAwMDAnLCAncmVkJ1xuICAgICAgICBjcmVhdGVNYXJrZXIgW1sxLDE4XSxbMSwyM11dLCAnIzAwZmYwMCcsICdncmVlbidcbiAgICAgICAgY3JlYXRlTWFya2VyIFtbMSwyNV0sWzEsMjldXSwgJyMwMDAwZmYnLCAnYmx1ZSdcbiAgICAgIF1cblxuICAgICAgQ29sb3JNYXJrZXJFbGVtZW50LnNldE1hcmtlclR5cGUoJ3NxdWFyZS1kb3QnKVxuXG4gICAgICBtYXJrZXJzRWxlbWVudHMgPSBtYXJrZXJzLm1hcCAoY29sb3JNYXJrZXIpIC0+XG4gICAgICAgIGNvbG9yTWFya2VyRWxlbWVudCA9IG5ldyBDb2xvck1hcmtlckVsZW1lbnRcbiAgICAgICAgY29sb3JNYXJrZXJFbGVtZW50LnNldENvbnRhaW5lclxuICAgICAgICAgIGVkaXRvcjogZWRpdG9yXG4gICAgICAgICAgdXNlTmF0aXZlRGVjb3JhdGlvbnM6IC0+IGZhbHNlXG4gICAgICAgICAgcmVxdWVzdE1hcmtlclVwZGF0ZTogKFttYXJrZXJdKSAtPiBtYXJrZXIucmVuZGVyKClcblxuICAgICAgICBjb2xvck1hcmtlckVsZW1lbnQuc2V0TW9kZWwoY29sb3JNYXJrZXIpXG5cbiAgICAgICAgamFzbWluZUNvbnRlbnQuYXBwZW5kQ2hpbGQoY29sb3JNYXJrZXJFbGVtZW50KVxuICAgICAgICBjb2xvck1hcmtlckVsZW1lbnRcblxuICAgIGl0ICdhZGRzIHRoZSBkb3QgY2xhc3Mgb24gdGhlIG1hcmtlcicsIC0+XG4gICAgICBmb3IgbWFya2Vyc0VsZW1lbnQgaW4gbWFya2Vyc0VsZW1lbnRzXG4gICAgICAgIGV4cGVjdChtYXJrZXJzRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2RvdCcpKS50b0JlVHJ1dGh5KClcbiAgICAgICAgZXhwZWN0KG1hcmtlcnNFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnc3F1YXJlJykpLnRvQmVUcnV0aHkoKVxuIl19
