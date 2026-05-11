"use client";

import { useState } from "react";
import { apiUrl } from "@/utils/api";
import { getStoredUTMParams } from "@/utils/utm";

export function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      utm: getStoredUTMParams()
    };

    try {
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Contact request failed.");
      }

      event.currentTarget.reset();
      setStatus("success");
      setMessage("Thanks, your message has been sent. We will get back to you soon.");
    } catch (_error) {
      setStatus("error");
      setMessage(
        "We could not send your message right now. Please try again in a moment."
      );
    }
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
      {message ? (
        <p className={status === "success" ? "success-text" : "error-text"}>
          {message}
        </p>
      ) : null}
      <button className="button" disabled={status === "loading"} type="submit">
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
