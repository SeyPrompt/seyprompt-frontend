"use client";

export function ContactForm() {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    console.log("SeyPrompt contact form", {
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message")
    });

    event.currentTarget.reset();
  }

  return (
    <form className="panel contact-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="Your name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" placeholder="you@example.com" required type="email" />
      </div>
      <div className="field">
        <label htmlFor="topic">What do you need?</label>
        <select defaultValue="Custom Prompts" id="topic" name="topic">
          <option>Custom Prompts</option>
          <option>AI Consultation</option>
          <option>Other</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          placeholder="Tell us what you want to build or improve..."
          required
        />
      </div>
      <button className="button" type="submit">
        Send Message
      </button>
    </form>
  );
}
