
module.exports.generateSpiral = function(starting_lat, starting_lng) {
  var step_size = 0.0005
  var step_limit = 49
  var coords = [{ latitude: starting_lat, longitude: starting_lng }];
  var steps = 1
  var x = 0
  var y = 0
  var d = 1
  var m = 1
  var rlow = 0.0
  var rhigh = 0.0005
  while (steps < step_limit) {
    while (2 * x * d < m && steps < step_limit) {
      x += d
      steps += 1
      let lat = x * step_size + starting_lat
      let lng = y * step_size + starting_lng
      coords.push( { latitude: lat, longitude: lng } )
    }
    while (2 * y * d < m && steps < step_limit) {
      y += d
      steps += 1
      let lat = x * step_size + starting_lat
      let lng = y * step_size + starting_lng
      coords.push( { latitude: lat, longitude: lng } )
    }
    d = -1 * d
    m += 1
  }
  return coords;
}
