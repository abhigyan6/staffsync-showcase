import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Plus, PushPin, PencilSimple, Trash } from "@phosphor-icons/react";
import { useApp, useResource } from "../../hooks";
import { api, message, dateLabel } from "../../api";
import {
  PageHeading,
  Panel,
  Loading,
  Failure,
  Empty,
  Pager,
  Field,
  FormDialog,
  Confirm,
} from "../../components";
const defaults = {
  title: "",
  content: "",
  category: "Company",
  targetAudience: "All",
  pinned: false,
};
export default function Announcements() {
  const user = useSelector((s) => s.auth.user),
    canPost = ["hr", "manager"].includes(user.role);
  const { toast, refresh } = useApp();
  const [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [values, setValues] = useState(defaults),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [remove, setRemove] = useState(null);
  const list = useResource(
    "/announcements?" + new URLSearchParams({ category, page: String(page) }),
  );
  function edit(a) {
    setEditing(a || null);
    setValues(
      a
        ? {
            title: a.title,
            content: a.content,
            category: a.category,
            pinned: a.pinned,
            targetAudience: a.targetAudience || "All",
          }
        : defaults,
    );
    setError("");
    setOpen(true);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api[editing ? "patch" : "post"](
        editing ? `/announcements/${editing._id}` : "/announcements",
        values,
      );
      toast(editing ? "Announcement updated." : "Announcement published.");
      setOpen(false);
      refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function removeItem() {
    setBusy(true);
    try {
      await api.delete(`/announcements/${remove._id}`);
      setRemove(null);
      toast("Announcement deleted.");
      refresh();
    } catch (e) {
      toast(message(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="The noticeboard"
        description="Company news, shared moments, and updates worth knowing."
      >
        {canPost && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => edit()}
          >
            Post announcement
          </Button>
        )}
      </PageHeading>
      <div className="announcement-filters">
        <TextField
          label="Category"
          select
          size="small"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All updates</MenuItem>
          {["Company", "People", "Events", "Policy"].map((c) => (
            <MenuItem value={c} key={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <span className="muted">{list.data?.total || 0} announcements</span>
      </div>
      {list.error ? (
        <Failure error={list.error} retry={list.refresh} />
      ) : list.loading && !list.data ? (
        <Loading />
      ) : !list.data?.items.length ? (
        <Panel title="Announcements">
          <Empty
            title="A fresh noticeboard"
            description="Published company updates will appear here."
          />
        </Panel>
      ) : (
        <div className="announcement-grid">
          {list.data.items.map((a) => (
            <article
              className={`announcement-card ${a.pinned ? "pinned" : ""}`}
              key={a._id}
            >
              <div className="announcement-card-top">
                <span
                  className={`category-label category-${a.category.toLowerCase()}`}
                >
                  {a.category}
                </span>
                {a.pinned && (
                  <span className="pinned-label">
                    <PushPin size={15} weight="fill" />
                    Pinned
                  </span>
                )}
              </div>
              <p className="muted">Audience: {a.targetAudience || "All"}</p>
              <h2>{a.title}</h2>
              <p className="announcement-content">{a.content}</p>
              <div className="announcement-card-footer">
                <div>
                  <strong>
                    {a.author?.role === "hr" ? "People team" : "Team manager"}
                  </strong>
                  <span>
                    {dateLabel(a.createdAt, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {canPost &&
                  (user.role === "hr" || a.author?._id === user.id) && (
                    <div>
                      <Tooltip title="Edit announcement">
                        <IconButton
                          aria-label={`Edit ${a.title}`}
                          onClick={() => edit(a)}
                        >
                          <PencilSimple size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete announcement">
                        <IconButton
                          aria-label={`Delete ${a.title}`}
                          onClick={() => setRemove(a)}
                        >
                          <Trash size={18} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
      {list.data && (
        <Pager total={list.data.total} page={page} setPage={setPage} />
      )}
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit announcement" : "Share an update"}
        subtitle="Help everyone stay informed and connected."
        onSubmit={save}
        busy={busy}
        error={error}
        submitLabel={editing ? "Save changes" : "Publish announcement"}
      >
        <Field
          name="title"
          label="Title"
          inputProps={{ maxLength: 150 }}
          values={values}
          setValues={setValues}
        />
        <Field
          name="category"
          label="Category"
          options={["Company", "People", "Events", "Policy"]}
          values={values}
          setValues={setValues}
        />
        <Field
          name="content"
          label="Your announcement"
          multiline
          rows={6}
          inputProps={{ maxLength: 5000 }}
          values={values}
          setValues={setValues}
        />
        <Field
          name="targetAudience"
          label="Audience"
          options={["All", "Employees", "Managers"]}
          values={values}
          setValues={setValues}
        />
        <FormControlLabel
          control={
            <Switch
              checked={values.pinned}
              onChange={(e) =>
                setValues((v) => ({ ...v, pinned: e.target.checked }))
              }
            />
          }
          label="Pin to the top of the noticeboard"
        />
      </FormDialog>
      <Confirm
        open={!!remove}
        onClose={() => setRemove(null)}
        onConfirm={removeItem}
        title="Delete announcement?"
        description="This update will be removed from the noticeboard."
        busy={busy}
      />
    </>
  );
}
