$(document).ready(function() {

  window.TerminalCommands["auto"] = function(tokens) {
    setTimeout(function() {
      $.publish("presentation:slide:next");
      window.TerminalCommands["auto"]();
    },15000)
  };

});