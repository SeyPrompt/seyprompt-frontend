import Link from "next/link";
import { Pencil } from "lucide-react";
import { fetchAdminPrompts } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";
import { getPromptCategories } from "@/lib/prompt-metadata";
import { DeletePromptButton } from "@/components/delete-prompt-button";

export const metadata = {
  title: "Admin Prompts",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

function truncateDescription(description = "") {
  const cleanDescription = String(description).trim();

  if (cleanDescription.length <= 92) {
    return cleanDescription;
  }

  return `${cleanDescription.slice(0, 89).trimEnd()}...`;
}

export default async function AdminPromptsPage({ searchParams }) {
  const token = await requireAdminToken();
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || "";
  const status = resolvedSearchParams?.status || "";

  const response = await fetchAdminPrompts(token, {
    q,
    status,
    limit: "50"
  }).catch(() => ({
    data: [],
    pagination: { total: 0 }
  }));

  return (
    <div className="stack">
      <form className="admin-toolbar" method="get">
        <input defaultValue={q} name="q" placeholder="Search title, tags, tools..." />
        <select defaultValue={status} name="status">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button className="button" type="submit">
          Filter
        </button>
        <Link className="button" href="/admin/prompts/new">
          Add New Prompt
        </Link>
      </form>

      <div className="panel form-card">
        <div className="section-header">
          <div>
            <strong>{response.pagination?.total || 0}</strong>{" "}
            <span className="muted">prompt records</span>
          </div>
        </div>

        {response.data?.length ? (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Tools</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {response.data.map((prompt) => {
                    const categories = getPromptCategories(prompt);
                    const [primaryCategory, ...remainingCategories] = categories;
                    const [firstTool, ...remainingTools] = prompt.tools || [];

                    return (
                      <tr key={prompt._id || prompt.id}>
                        <td>
                          <strong>{prompt.title}</strong>
                          <div className="muted">{prompt.slug}</div>
                          {prompt.description ? (
                            <div className="muted admin-prompt-description">
                              {truncateDescription(prompt.description)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div className="pill-row">
                            <span className="pill">{primaryCategory || "General"}</span>
                            {remainingCategories.length ? (
                              <span className="pill pill-count">+{remainingCategories.length}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="pill-row">
                            {firstTool ? <span className="pill pill-alt">{firstTool}</span> : null}
                            {remainingTools.length ? (
                              <span className="pill pill-alt pill-count">+{remainingTools.length}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge">{prompt.status}</span>
                        </td>
                        <td>
                          <div className="admin-icon-actions">
                            <Link
                              aria-label={`Edit ${prompt.title}`}
                              className="icon-button"
                              href={`/admin/prompts/${prompt._id || prompt.id}/edit`}
                              title="Edit"
                            >
                              <Pencil aria-hidden="true" size={18} />
                            </Link>
                            <DeletePromptButton iconOnly id={prompt._id || prompt.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="admin-card-list">
              {response.data.map((prompt) => {
                const categories = getPromptCategories(prompt);
                const [primaryCategory, ...remainingCategories] = categories;
                const [firstTool, ...remainingTools] = prompt.tools || [];

                return (
                  <article className="admin-prompt-card" key={prompt._id || prompt.id}>
                    <div>
                      <strong>{prompt.title}</strong>
                      <p className="muted">{prompt.slug}</p>
                      {prompt.description ? (
                        <p className="muted admin-prompt-description">
                          {truncateDescription(prompt.description)}
                        </p>
                      ) : null}
                    </div>
                    <div className="admin-card-meta">
                      <span>{primaryCategory || "General"}</span>
                      {remainingCategories.length ? <span>+{remainingCategories.length}</span> : null}
                      {firstTool ? <span>{firstTool}</span> : null}
                      {remainingTools.length ? <span>+{remainingTools.length}</span> : null}
                      <span className="status-badge">{prompt.status}</span>
                    </div>
                    <div className="admin-icon-actions">
                      <Link
                        aria-label={`Edit ${prompt.title}`}
                        className="icon-button"
                        href={`/admin/prompts/${prompt._id || prompt.id}/edit`}
                        title="Edit"
                      >
                        <Pencil aria-hidden="true" size={18} />
                      </Link>
                      <DeletePromptButton iconOnly id={prompt._id || prompt.id} />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>No prompts found</h3>
            <p className="muted">Create your first prompt or broaden the filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
