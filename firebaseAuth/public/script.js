document.addEventListener("DOMContentLoaded", function () {
  let registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const registerEmail = document.getElementById("registerEmail").value;
      const registerPassword =
        document.getElementById("registerPassword").value;
      const firstName = document.getElementById('registerFirstName').value;
      const lastName = document.getElementById('registerLastName').value;
      const age = document.getElementById('registerAge').value;

      fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          firstName: firstName,
          lastName: lastName,
          age: age,
        }),
      })
        .then((response) => response.json())
        .then((data) => alert("Registration Done"))
        .catch((error) => alert(error.message));
    });
  }

  let loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Login called");
      const loginEmail = document.getElementById("loginEmail").value;
      const loginPassword = document.getElementById("loginPassword").value;

      fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Login failed");
          }
          return response.json();
        })
        .then((data) => {
          alert("Login successful");
          localStorage.setItem("token", data.token);
        })
        .catch((error) => alert(error.message));
    });
  }
});

function getProfile() {
  const token = localStorage.getItem("token");
  // console.log(token);
  if (!token) {
    alert("Please login first");
    return;
  }

  fetch("/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Profile not found");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("profileData").innerText = JSON.stringify(data);
    })
    .catch((error) => alert(error.message));
}
