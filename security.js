document.addEventListener("keydown", function (e) {
          if (
            e.key === "F12" ||
            (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
            (e.ctrlKey && e.key === "U")
          ) {
            e.preventDefault();
            alert("Inspección desactivada.");
          }
        });



        document.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });