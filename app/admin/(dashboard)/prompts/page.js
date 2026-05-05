import Link from "next/link";
import { fetchAdminPrompts } from "@/lib/api";
import { requireAdminToken } from "@/lib/auth";
import { DeletePromptButton } from "@/components/delete-prompt-button";

export const metadata = {
  title: "Admin Prompts"
};

export default async function AdminPromptsPage({ searchParams }) {
  const token = await requireAdminToken();
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || "";
  const status = resolvedSearchParams?.status || "";
  const visibility = resolvedSearchParams?.visibility || "";

  const response = await fetchAdminPrompts(token, {
    q,
    status,
    visibility,
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
        <select defaultValue={visibility} name="visibility">
          <option value="">All visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
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
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {response.data.map((prompt) => (
                    <tr key={prompt._id || prompt.id}>
                      <td>
                        <strong>{prompt.title}</strong>
                        <div className="muted">{prompt.slug}</div>
                      </td>
                      <td>{prompt.category || "General"}</td>
                      <td>
                        <div className="pill-row">
                          {(prompt.tools || []).slice(0, 2).map((tool) => (
                            <span className="pill pill-alt" key={tool}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="status-badge">{prompt.status}</span>
                      </td>
                      <td>{prompt.visibility}</td>
                      <td>
                        <div className="toolbar">
                          <Link
                            className="button-secondary"
                            href={`/admin/prompts/${prompt._id || prompt.id}/edit`}
                          >
                            Edit
                          </Link>
                          <DeletePromptButton id={prompt._id || prompt.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-card-list">
              {response.data.map((prompt) => (
                <article className="admin-prompt-card" key={prompt._id || prompt.id}>
                  <div>
                    <strong>{prompt.title}</strong>
                    <p className="muted">{prompt.slug}</p>
                  </div>
                  <div className="admin-card-meta">
                    <span>{prompt.category || "General"}</span>
                    <span className="status-badge">{prompt.status}</span>
                    <span>{prompt.visibility}</span>
                  </div>
                  <div className="toolbar">
                    <Link
                      className="button-secondary"
                      href={`/admin/prompts/${prompt._id || prompt.id}/edit`}
                    >
                      Edit
                    </Link>
                    <DeletePromptButton id={prompt._id || prompt.id} />
                  </div>
                </article>
              ))}
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
