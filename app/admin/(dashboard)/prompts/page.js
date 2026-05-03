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
      <form className="panel form-card toolbar" method="get">
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
        <Link className="button-secondary" href="/admin/prompts/new">
          New Prompt
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
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {response.data.map((prompt) => (
                  <tr key={prompt._id}>
                    <td>
                      <strong>{prompt.title}</strong>
                      <div className="muted">{prompt.slug}</div>
                    </td>
                    <td>{prompt.category || "General"}</td>
                    <td>
                      <span className="status-badge">{prompt.status}</span>
                    </td>
                    <td>{prompt.visibility}</td>
                    <td>
                      <div className="toolbar">
                        <Link
                          className="button-secondary"
                          href={`/admin/prompts/${prompt._id}/edit`}
                        >
                          Edit
                        </Link>
                        <DeletePromptButton id={prompt._id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
