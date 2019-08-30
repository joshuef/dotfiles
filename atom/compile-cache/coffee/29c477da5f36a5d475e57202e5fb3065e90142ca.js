(function() {
  var fs, path,
    slice = [].slice;

  fs = require('fs');

  path = require('path');

  module.exports = {
    jsonFixture: function() {
      var paths;
      paths = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return function(fixture, data) {
        var json, jsonPath;
        jsonPath = path.resolve.apply(path, slice.call(paths).concat([fixture]));
        json = fs.readFileSync(jsonPath).toString();
        json = json.replace(/#\{([\w\[\]]+)\}/g, function(m, w) {
          var _, match;
          if (match = /^\[(\w+)\]$/.exec(w)) {
            _ = match[0], w = match[1];
            return data[w].shift();
          } else {
            return data[w];
          }
        });
        return JSON.parse(json);
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9oZWxwZXJzL2ZpeHR1cmVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsUUFBQTtJQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFdBQUEsRUFBYSxTQUFBO0FBQWMsVUFBQTtNQUFiO2FBQWEsU0FBQyxPQUFELEVBQVUsSUFBVjtBQUN6QixZQUFBO1FBQUEsUUFBQSxHQUFXLElBQUksQ0FBQyxPQUFMLGFBQWEsV0FBQSxLQUFBLENBQUEsUUFBVSxDQUFBLE9BQUEsQ0FBVixDQUFiO1FBQ1gsSUFBQSxHQUFPLEVBQUUsQ0FBQyxZQUFILENBQWdCLFFBQWhCLENBQXlCLENBQUMsUUFBMUIsQ0FBQTtRQUNQLElBQUEsR0FBTyxJQUFJLENBQUMsT0FBTCxDQUFhLG1CQUFiLEVBQWtDLFNBQUMsQ0FBRCxFQUFHLENBQUg7QUFDdkMsY0FBQTtVQUFBLElBQUcsS0FBQSxHQUFRLGFBQWEsQ0FBQyxJQUFkLENBQW1CLENBQW5CLENBQVg7WUFDRyxZQUFELEVBQUc7bUJBQ0gsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQVIsQ0FBQSxFQUZGO1dBQUEsTUFBQTttQkFJRSxJQUFLLENBQUEsQ0FBQSxFQUpQOztRQUR1QyxDQUFsQztlQU9QLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWDtNQVZ5QjtJQUFkLENBQWI7O0FBSkYiLCJzb3VyY2VzQ29udGVudCI6WyJmcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAganNvbkZpeHR1cmU6IChwYXRocy4uLikgLT4gKGZpeHR1cmUsIGRhdGEpIC0+XG4gICAganNvblBhdGggPSBwYXRoLnJlc29sdmUocGF0aHMuLi4sIGZpeHR1cmUpXG4gICAganNvbiA9IGZzLnJlYWRGaWxlU3luYyhqc29uUGF0aCkudG9TdHJpbmcoKVxuICAgIGpzb24gPSBqc29uLnJlcGxhY2UgLyNcXHsoW1xcd1xcW1xcXV0rKVxcfS9nLCAobSx3KSAtPlxuICAgICAgaWYgbWF0Y2ggPSAvXlxcWyhcXHcrKVxcXSQvLmV4ZWModylcbiAgICAgICAgW18sd10gPSBtYXRjaFxuICAgICAgICBkYXRhW3ddLnNoaWZ0KClcbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YVt3XVxuXG4gICAgSlNPTi5wYXJzZShqc29uKVxuIl19
