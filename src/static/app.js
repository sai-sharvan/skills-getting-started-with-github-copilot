document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to escape HTML
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep default)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        let participantsHTML;
        const hasParticipants = details.participants && details.participants.length;
        if (hasParticipants) {
          participantsHTML = `<p><strong>Participants:</strong></p><div class="participants-container"></div>`;
        } else {
          participantsHTML = '<p class="info">No participants yet.</p>';
        }

        activityCard.innerHTML = `
          <h4>${escapeHTML(name)}</h4>
          <p>${escapeHTML(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHTML(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // If there are participants, create the list with delete buttons
        if (hasParticipants) {
          const container = activityCard.querySelector('.participants-container');
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            const li = document.createElement('li');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = p;
            nameSpan.className = 'participant-name';

            const badge = document.createElement('span');
            badge.className = 'participant-badge';
            badge.textContent = 'Signed';

            const btn = document.createElement('button');
            btn.className = 'delete-participant';
            btn.title = 'Unregister participant';
            btn.textContent = '✖';

            btn.addEventListener('click', async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: 'POST' }
                );

                const result = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  // Refresh activities to update counts and lists
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }

                setTimeout(() => {
                  messageDiv.classList.add('hidden');
                }, 4000);
              } catch (err) {
                console.error('Error unregistering:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(badge);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          container.appendChild(ul);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
