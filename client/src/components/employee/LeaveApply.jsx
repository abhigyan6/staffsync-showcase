import { Alert } from "@mui/material";
import { Field, FormDialog } from "../../components";
export default function LeaveApply({
  open,
  onClose,
  apply,
  busy,
  error,
  values,
  setValues,
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Request time off"
      subtitle="Choose your dates and tell us a little about your request."
      onSubmit={apply}
      busy={busy}
      error={error}
      submitLabel="Submit request"
    >
      <Field
        name="type"
        label="Leave type"
        options={["Annual", "Sick", "Personal", "Unpaid"]}
        values={values}
        setValues={setValues}
      />
      <div className="form-grid">
        <Field
          name="startDate"
          label="Start date"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          values={values}
          setValues={setValues}
        />
        <Field
          name="endDate"
          label="End date"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          values={values}
          setValues={setValues}
        />
      </div>
      <Field
        name="reason"
        label="Reason"
        multiline
        rows={4}
        inputProps={{ maxLength: 1000 }}
        values={values}
        setValues={setValues}
      />
      <Alert severity="info">
        Duration is counted in calendar days, including weekends. Requests may
        span up to 90 days.
      </Alert>
    </FormDialog>
  );
}
