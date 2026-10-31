function ReportForm({ onSubmit, onCancel }) {
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const newReport = {
      id: Date.now(),
      title: formData.get("title"),
      category: formData.get("category"),
      location: formData.get("location"),
      severity: formData.get("severity"),
      status: "Pending",
      time: "Just now",
    };

    onSubmit(newReport);
    event.target.reset();
  }

  return (
    <section className="report-form-container">
      <div className="form-heading">
        <h2>Report an Incident</h2>
        <p>Help keep your campus community informed and safe.</p>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>Incident Title</label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Fallen tree near the library"
            required
          />
        </div>

        <div className="form-group">
          <label>Incident Category</label>
          <select name="category" required defaultValue="">
            <option value="" disabled>
              Select a category
            </option>
            <option>Road Hazard</option>
            <option>Obstruction</option>
            <option>Flooding</option>
            <option>Infrastructure</option>
            <option>Security</option>
            <option>Fire</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            placeholder="Where did this happen?"
            required
          />
        </div>

        <div className="form-group">
          <label>Severity Level</label>
          <select name="severity" required defaultValue="">
            <option value="" disabled>
              Select severity
            </option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            name="description"
            placeholder="Provide additional details about the incident..."
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>

          <button type="submit" className="submit-btn">
            Submit Report
          </button>
        </div>
      </form>
    </section>
  );
}

export default ReportForm;
