let appPagePath = "app.html";

window.addEventListener("DOMContentLoaded", function () {
  const userData = localStorage.getItem("taskflow_user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user.name && user.dateOfBirth && user.verified) {
        window.location.href = appPagePath;
        return;
      }
    } catch (e) {
      localStorage.removeItem("taskflow_user");
    }
  }
});

document
  .getElementById("verificationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const btnText = submitBtn.querySelector(".btn-text");
    const loading = submitBtn.querySelector(".loading");
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.style.display = "none";

    const formData = new FormData(this);
    const fullName = formData.get("fullName").trim();
    const dateOfBirth = formData.get("dateOfBirth");

    if (!fullName) {
      showError("Please enter your full name.");
      return;
    }

    if (!dateOfBirth) {
      showError("Please enter your date of birth.");
      return;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age <= 10) {
      showError("You must be over 10 years old to access TaskFlow.");
      return;
    }

    submitBtn.disabled = true;
    btnText.style.opacity = "0";
    loading.style.display = "block";

    setTimeout(() => {
      const userData = {
        name: fullName,
        dateOfBirth: dateOfBirth,
        age: age,
        verified: true,
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem("taskflow_user", JSON.stringify(userData));

      window.location.href = appPagePath;
    }, 1500);
  });

function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.style.display = "block";

  errorMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
