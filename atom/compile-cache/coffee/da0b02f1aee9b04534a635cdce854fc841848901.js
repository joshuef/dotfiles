(function() {
  beforeEach(function() {
    var compare;
    compare = function(a, b, p) {
      return Math.abs(b - a) < (Math.pow(10, -p) / 2);
    };
    return this.addMatchers({
      toBeComponentArrayCloseTo: function(arr, precision) {
        var notText;
        if (precision == null) {
          precision = 0;
        }
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be an array whose values are close to " + (jasmine.pp(arr)) + " with a precision of " + precision;
          };
        })(this);
        if (this.actual.length !== arr.length) {
          return false;
        }
        return this.actual.every(function(value, i) {
          return compare(value, arr[i], precision);
        });
      },
      toBeValid: function() {
        var notText;
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be a valid color";
          };
        })(this);
        return this.actual.isValid();
      },
      toBeColor: function(colorOrRed, green, blue, alpha) {
        var color, hex, notText, red;
        if (green == null) {
          green = 0;
        }
        if (blue == null) {
          blue = 0;
        }
        if (alpha == null) {
          alpha = 1;
        }
        color = (function() {
          switch (typeof colorOrRed) {
            case 'object':
              return colorOrRed;
            case 'number':
              return {
                red: colorOrRed,
                green: green,
                blue: blue,
                alpha: alpha
              };
            case 'string':
              colorOrRed = colorOrRed.replace(/#|0x/, '');
              hex = parseInt(colorOrRed, 16);
              switch (colorOrRed.length) {
                case 8:
                  alpha = (hex >> 24 & 0xff) / 255;
                  red = hex >> 16 & 0xff;
                  green = hex >> 8 & 0xff;
                  blue = hex & 0xff;
                  break;
                case 6:
                  red = hex >> 16 & 0xff;
                  green = hex >> 8 & 0xff;
                  blue = hex & 0xff;
                  break;
                case 3:
                  red = (hex >> 8 & 0xf) * 17;
                  green = (hex >> 4 & 0xf) * 17;
                  blue = (hex & 0xf) * 17;
                  break;
                default:
                  red = 0;
                  green = 0;
                  blue = 0;
                  alpha = 1;
              }
              return {
                red: red,
                green: green,
                blue: blue,
                alpha: alpha
              };
            default:
              return {
                red: 0,
                green: 0,
                blue: 0,
                alpha: 1
              };
          }
        })();
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be a color equal to " + (jasmine.pp(color));
          };
        })(this);
        return Math.round(this.actual.red) === color.red && Math.round(this.actual.green) === color.green && Math.round(this.actual.blue) === color.blue && compare(this.actual.alpha, color.alpha, 1);
      }
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9oZWxwZXJzL21hdGNoZXJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsUUFBQTtJQUFBLE9BQUEsR0FBVSxTQUFDLENBQUQsRUFBRyxDQUFILEVBQUssQ0FBTDthQUFXLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBQSxHQUFJLENBQWIsQ0FBQSxHQUFrQixDQUFDLElBQUksQ0FBQyxHQUFMLENBQVMsRUFBVCxFQUFhLENBQUMsQ0FBZCxDQUFBLEdBQW1CLENBQXBCO0lBQTdCO1dBRVYsSUFBQyxDQUFBLFdBQUQsQ0FDRTtNQUFBLHlCQUFBLEVBQTJCLFNBQUMsR0FBRCxFQUFNLFNBQU47QUFDekIsWUFBQTs7VUFEK0IsWUFBVTs7UUFDekMsT0FBQSxHQUFhLElBQUMsQ0FBQSxLQUFKLEdBQWUsTUFBZixHQUEyQjtRQUNyQyxJQUFJLENBQUMsT0FBTCxHQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsV0FBQSxHQUFXLENBQUMsT0FBTyxDQUFDLEVBQVIsQ0FBVyxLQUFDLENBQUEsTUFBWixDQUFELENBQVgsR0FBZ0MsS0FBaEMsR0FBcUMsT0FBckMsR0FBNkMseUNBQTdDLEdBQXFGLENBQUMsT0FBTyxDQUFDLEVBQVIsQ0FBVyxHQUFYLENBQUQsQ0FBckYsR0FBc0csdUJBQXRHLEdBQTZIO1VBQWhJO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtRQUVmLElBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixLQUFvQixHQUFHLENBQUMsTUFBeEM7QUFBQSxpQkFBTyxNQUFQOztlQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFjLFNBQUMsS0FBRCxFQUFPLENBQVA7aUJBQWEsT0FBQSxDQUFRLEtBQVIsRUFBZSxHQUFJLENBQUEsQ0FBQSxDQUFu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LENBQUEsS0FBMkIsS0FBSyxDQUFDLEdBQWpDLElBQ0EsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQW5CLENBQUEsS0FBNkIsS0FBSyxDQUFDLEtBRG5DLElBRUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQW5CLENBQUEsS0FBNEIsS0FBSyxDQUFDLElBRmxDLElBR0EsT0FBQSxDQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBaEIsRUFBdUIsS0FBSyxDQUFDLEtBQTdCLEVBQW9DLENBQXBDO01BckNTLENBZFg7S0FERjtFQUhTLENBQVg7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuYmVmb3JlRWFjaCAtPlxuICBjb21wYXJlID0gKGEsYixwKSAtPiBNYXRoLmFicyhiIC0gYSkgPCAoTWF0aC5wb3coMTAsIC1wKSAvIDIpXG5cbiAgQGFkZE1hdGNoZXJzXG4gICAgdG9CZUNvbXBvbmVudEFycmF5Q2xvc2VUbzogKGFyciwgcHJlY2lzaW9uPTApIC0+XG4gICAgICBub3RUZXh0ID0gaWYgQGlzTm90IHRoZW4gXCIgbm90XCIgZWxzZSBcIlwiXG4gICAgICB0aGlzLm1lc3NhZ2UgPSA9PiBcIkV4cGVjdGVkICN7amFzbWluZS5wcChAYWN0dWFsKX0gdG8je25vdFRleHR9IGJlIGFuIGFycmF5IHdob3NlIHZhbHVlcyBhcmUgY2xvc2UgdG8gI3tqYXNtaW5lLnBwKGFycil9IHdpdGggYSBwcmVjaXNpb24gb2YgI3twcmVjaXNpb259XCJcblxuICAgICAgcmV0dXJuIGZhbHNlIGlmIEBhY3R1YWwubGVuZ3RoIGlzbnQgYXJyLmxlbmd0aFxuXG4gICAgICBAYWN0dWFsLmV2ZXJ5ICh2YWx1ZSxpKSAtPiBjb21wYXJlKHZhbHVlLCBhcnJbaV0sIHByZWNpc2lvbilcblxuICAgIHRvQmVWYWxpZDogLT5cbiAgICAgIG5vdFRleHQgPSBpZiBAaXNOb3QgdGhlbiBcIiBub3RcIiBlbHNlIFwiXCJcbiAgICAgIHRoaXMubWVzc2FnZSA9ID0+IFwiRXhwZWN0ZWQgI3tqYXNtaW5lLnBwKEBhY3R1YWwpfSB0byN7bm90VGV4dH0gYmUgYSB2YWxpZCBjb2xvclwiXG5cbiAgICAgIEBhY3R1YWwuaXNWYWxpZCgpXG5cbiAgICB0b0JlQ29sb3I6IChjb2xvck9yUmVkLGdyZWVuPTAsYmx1ZT0wLGFscGhhPTEpIC0+XG4gICAgICBjb2xvciA9IHN3aXRjaCB0eXBlb2YgY29sb3JPclJlZFxuICAgICAgICB3aGVuICdvYmplY3QnIHRoZW4gY29sb3JPclJlZFxuICAgICAgICB3aGVuICdudW1iZXInIHRoZW4ge3JlZDogY29sb3JPclJlZCwgZ3JlZW4sIGJsdWUsIGFscGhhfVxuICAgICAgICB3aGVuICdzdHJpbmcnXG4gICAgICAgICAgY29sb3JPclJlZCA9IGNvbG9yT3JSZWQucmVwbGFjZSgvI3wweC8sICcnKVxuICAgICAgICAgIGhleCA9IHBhcnNlSW50KGNvbG9yT3JSZWQsIDE2KVxuICAgICAgICAgIHN3aXRjaCBjb2xvck9yUmVkLmxlbmd0aFxuICAgICAgICAgICAgd2hlbiA4XG4gICAgICAgICAgICAgIGFscGhhID0gKGhleCA+PiAyNCAmIDB4ZmYpIC8gMjU1XG4gICAgICAgICAgICAgIHJlZCA9IGhleCA+PiAxNiAmIDB4ZmZcbiAgICAgICAgICAgICAgZ3JlZW4gPSBoZXggPj4gOCAmIDB4ZmZcbiAgICAgICAgICAgICAgYmx1ZSA9IGhleCAmIDB4ZmZcbiAgICAgICAgICAgIHdoZW4gNlxuICAgICAgICAgICAgICByZWQgPSBoZXggPj4gMTYgJiAweGZmXG4gICAgICAgICAgICAgIGdyZWVuID0gaGV4ID4+IDggJiAweGZmXG4gICAgICAgICAgICAgIGJsdWUgPSBoZXggJiAweGZmXG4gICAgICAgICAgICB3aGVuIDNcbiAgICAgICAgICAgICAgcmVkID0gKGhleCA+PiA4ICYgMHhmKSAqIDE3XG4gICAgICAgICAgICAgIGdyZWVuID0gKGhleCA+PiA0ICYgMHhmKSAqIDE3XG4gICAgICAgICAgICAgIGJsdWUgPSAoaGV4ICYgMHhmKSAqIDE3XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHJlZCA9IDBcbiAgICAgICAgICAgICAgZ3JlZW4gPSAwXG4gICAgICAgICAgICAgIGJsdWUgPSAwXG4gICAgICAgICAgICAgIGFscGhhID0gMVxuXG4gICAgICAgICAge3JlZCwgZ3JlZW4sIGJsdWUsIGFscGhhfVxuICAgICAgICBlbHNlXG4gICAgICAgICAge3JlZDogMCwgZ3JlZW46IDAsIGJsdWU6IDAsIGFscGhhOiAxfVxuXG4gICAgICBub3RUZXh0ID0gaWYgQGlzTm90IHRoZW4gXCIgbm90XCIgZWxzZSBcIlwiXG4gICAgICB0aGlzLm1lc3NhZ2UgPSA9PiBcIkV4cGVjdGVkICN7amFzbWluZS5wcChAYWN0dWFsKX0gdG8je25vdFRleHR9IGJlIGEgY29sb3IgZXF1YWwgdG8gI3tqYXNtaW5lLnBwKGNvbG9yKX1cIlxuXG4gICAgICBNYXRoLnJvdW5kKEBhY3R1YWwucmVkKSBpcyBjb2xvci5yZWQgYW5kXG4gICAgICBNYXRoLnJvdW5kKEBhY3R1YWwuZ3JlZW4pIGlzIGNvbG9yLmdyZWVuIGFuZFxuICAgICAgTWF0aC5yb3VuZChAYWN0dWFsLmJsdWUpIGlzIGNvbG9yLmJsdWUgYW5kXG4gICAgICBjb21wYXJlKEBhY3R1YWwuYWxwaGEsIGNvbG9yLmFscGhhLCAxKVxuIl19
