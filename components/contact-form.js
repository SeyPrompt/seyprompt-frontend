"use client";

import { useState } from "react";
import { apiUrl } from "@/utils/api";
import { trackEvent } from "@/lib/analytics";
import { getStoredUTMParams } from "@/utils/utm";

export function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setMessage("");

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      utm: getStoredUTMParams()
    };

    try {
      let data = null;
      const response = await fetch(apiUrl("/api/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      try {
        data = await response.json();
      } catch (_error) {
        data = null;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("Contact form response", {
          status: response.status,
          data
        });
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message ||
            "We could not send your message right now. Please try again in a moment."
        );
      }

      setStatus("success");
      setMessage(
        data?.message ||
          "Thanks — your message has been sent. We’ll get back to you soon."
      );
      trackEvent("contact_form_submit", {
        event_category: "Contact",
        topic: payload.topic
      });
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.message ||
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
