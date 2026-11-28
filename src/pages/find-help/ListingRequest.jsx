
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./ListingRequest.css";

const translations = {
  en: {
    eyebrow: "Community Resource Directory",
    apply: "Apply for a Listing",
    update: "Request to Update a Listing",
    applyIntro:
      "Tell us about your organisation and the services you provide to the community.",
    updateIntro:
      "Help us keep the information in our resource directory accurate and up to date.",
    organisation: "Organisation name",
    contact: "Contact person",
    email: "Email address",
    phone: "Phone number (optional)",
    reference: "Listing reference (optional)",
    applyDetails: "Organisation and service information",
    updateDetails: "What information needs to be updated?",
    applyPlaceholder:
      "Describe your services, location, website, opening hours and eligibility requirements.",
    updatePlaceholder:
      "Identify the existing service and describe the information that needs to be corrected.",
    invitation: "Invitation code",
    invitationNotice:
      "Submissions are currently available by invitation only. Enter the code provided by RCBC.",
    closedTitle: "Submissions are currently closed",
    closedText:
      "New listing requests are not being accepted at this time. Please check again later.",
    consent:
      "I consent to RCBC processing the information provided for the purpose of reviewing this listing request.",
    submit: "Submit request",
    submitting: "Submitting...",
    success: "Request submitted successfully",
    successText:
      "Thank you. Your request has been received for review by RCBC. Submission does not guarantee publication.",
    back: "Back to Resource Finder",
    loading: "Checking submission availability...",
    error: "Unable to complete your request. Please try again.",
    privacy: "Privacy Policy",
    review:
      "All requests are reviewed before any listing is published or updated.",
    requestReference: "Request reference",
    required: "Fields marked with * are required.",
    retry: "Try again",
    noSensitive:
      "Please do not include patient records or sensitive personal information."
  },

  ms: {
    eyebrow: "Direktori Sumber Komuniti",
    apply: "Mohon Penyenaraian",
    update: "Mohon Kemas Kini Penyenaraian",
    applyIntro:
      "Beritahu kami tentang organisasi dan perkhidmatan yang anda sediakan kepada komuniti.",
    updateIntro:
      "Bantu kami memastikan maklumat dalam direktori sentiasa tepat dan terkini.",
    organisation: "Nama organisasi",
    contact: "Nama pegawai untuk dihubungi",
    email: "Alamat e-mel",
    phone: "Nombor telefon (pilihan)",
    reference: "Rujukan penyenaraian (pilihan)",
    applyDetails: "Maklumat organisasi dan perkhidmatan",
    updateDetails: "Maklumat yang perlu dikemas kini",
    applyPlaceholder:
      "Terangkan perkhidmatan, lokasi, laman web, waktu operasi dan syarat kelayakan.",
    updatePlaceholder:
      "Nyatakan perkhidmatan sedia ada dan maklumat yang perlu dibetulkan.",
    invitation: "Kod jemputan",
    invitationNotice:
      "Permohonan hanya dibuka melalui jemputan. Masukkan kod yang diberikan oleh RCBC.",
    closedTitle: "Permohonan ditutup buat masa ini",
    closedText:
      "Permohonan baharu tidak diterima pada masa ini. Sila semak semula kemudian.",
    consent:
      "Saya bersetuju RCBC memproses maklumat yang diberikan untuk menyemak permohonan ini.",
    submit: "Hantar permohonan",
    submitting: "Sedang menghantar...",
    success: "Permohonan berjaya dihantar",
    successText:
      "Terima kasih. Permohonan anda telah diterima untuk semakan RCBC. Penghantaran tidak menjamin penerbitan.",
    back: "Kembali ke Pencari Sumber",
    loading: "Menyemak ketersediaan permohonan...",
    error: "Permohonan tidak dapat diproses. Sila cuba lagi.",
    privacy: "Dasar Privasi",
    review:
      "Semua permohonan disemak sebelum penyenaraian diterbitkan atau dikemas kini.",
    requestReference: "Rujukan permohonan",
    required: "Ruangan bertanda * wajib diisi.",
    retry: "Cuba lagi",
    noSensitive:
      "Jangan sertakan rekod pesakit atau maklumat peribadi sensitif."
  },

  zh: {
    eyebrow: "社区资源目录",
    apply: "申请加入目录",
    update: "申请更新目录信息",
    applyIntro:
      "请介绍您的机构及其为社区提供的服务。",
    updateIntro:
      "帮助我们确保资源目录中的信息准确并及时更新。",
    organisation: "机构名称",
    contact: "联系人姓名",
    email: "电子邮箱",
    phone: "电话号码（选填）",
    reference: "目录编号（选填）",
    applyDetails: "机构及服务信息",
    updateDetails: "需要更新的信息",
    applyPlaceholder:
      "请描述服务内容、地点、网站、营业时间及资格要求。",
    updatePlaceholder:
      "请注明现有服务及需要更正的信息。",
    invitation: "邀请码",
    invitationNotice:
      "目前仅接受受邀申请。请输入 RCBC 提供的邀请码。",
    closedTitle: "目前暂停接受申请",
    closedText:
      "目前暂不接受新的目录申请，请稍后再查看。",
    consent:
      "我同意 RCBC 为审核本次目录申请而处理所提供的信息。",
    submit: "提交申请",
    submitting: "正在提交...",
    success: "申请提交成功",
    successText:
      "感谢您。RCBC 已收到您的申请并将进行审核。提交申请不保证信息一定会发布。",
    back: "返回资源查找器",
    loading: "正在检查申请状态...",
    error: "无法完成申请，请重试。",
    privacy: "隐私政策",
    review:
      "所有申请均须经过审核后才可发布或更新。",
    requestReference: "申请编号",
    required: "标有 * 的字段为必填项。",
    retry: "重试",
    noSensitive:
      "请勿提供患者病历或敏感个人信息。"
  }
};

export default function ListingRequest({
  requestType = "apply"
}) {
  const { language } = useLanguage();
  const copy = translations[language] || translations.en;

  const [params] = useSearchParams();

  const isUpdate = requestType === "update";

  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  const [form, setForm] = useState({
    organisation_name: "",
    contact_name: "",
    email: "",
    phone: "",
    listing_id: isUpdate
      ? params.get("listing") || ""
      : "",
    details: "",
    invitation: "",
    consent: false
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/listing-request-settings", {
      signal: controller.signal,
      cache: "no-store"
    })
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => {
        if (
          !["closed", "invitation_only", "open"]
            .includes(data.mode)
        ) {
          throw new Error();
        }

        if (!controller.signal.aborted) {
          setMode(data.mode);
          setLoadError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [retry]);

  const updateField = (name, value) => {
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };

  const submitRequest = async event => {
    event.preventDefault();

    if (
      submitting ||
      loading ||
      loadError ||
      !["open", "invitation_only"].includes(mode)
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "/api/public/listing-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            request_type: requestType,
            listing_id: isUpdate
              ? form.listing_id
              : null,
            invitation: mode === "invitation_only"
              ? form.invitation.trim()
              : ""
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok || !data.id) {
        throw new Error(data.error || copy.error);
      }

      setSuccessId(data.id);

      setForm({
        organisation_name: "",
        contact_name: "",
        email: "",
        phone: "",
        listing_id: "",
        details: "",
        invitation: "",
        consent: false
      });

      window.scrollTo({
        top: 0,
        behavior: "auto"
      });
    } catch (err) {
      setError(
        language === "en"
          ? err.message || copy.error
          : copy.error
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="listing-request-page">
      <section className="lr-hero">
        <div className="lr-container">
          <Link
            className="lr-back-link"
            to="/find-help/resource-finder"
          >
            ← {copy.back}
          </Link>

          <p className="lr-eyebrow">
            {copy.eyebrow}
          </p>

          <h1>
            {isUpdate ? copy.update : copy.apply}
          </h1>

          <p className="lr-intro">
            {isUpdate
              ? copy.updateIntro
              : copy.applyIntro}
          </p>
        </div>
      </section>

      <section className="lr-content">
        <div className="lr-container">

          {loading && (
            <div className="lr-status-card" role="status">
              <p>{copy.loading}</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="lr-status-card" role="alert">
              <p>{copy.error}</p>

              <button
                type="button"
                className="lr-submit"
                onClick={() => {
                  setLoading(true);
                  setLoadError(false);
                  setRetry(current => current + 1);
                }}
              >
                {copy.retry}
              </button>
            </div>
          )}

          {!loading &&
            !loadError &&
            mode === "closed" &&
            !successId && (
              <div className="lr-status-card lr-closed">
                <span
                  className="lr-status-icon"
                  aria-hidden="true"
                >
                  ⓘ
                </span>

                <h2>{copy.closedTitle}</h2>
                <p>{copy.closedText}</p>

                <Link
                  className="lr-submit"
                  to="/find-help/resource-finder"
                >
                  {copy.back}
                </Link>
              </div>
            )}

          {successId && (
            <div
              className="lr-status-card lr-success"
              role="status"
            >
              <span
                className="lr-status-icon"
                aria-hidden="true"
              >
                ✓
              </span>

              <h2>{copy.success}</h2>

              <p>{copy.successText}</p>

              <div className="lr-reference">
                <strong>{copy.requestReference}</strong>
                <p>{successId}</p>
              </div>

              <Link
                className="lr-submit"
                to="/find-help/resource-finder"
              >
                {copy.back}
              </Link>
            </div>
          )}

          {!loading &&
            !loadError &&
            ["open", "invitation_only"].includes(mode) &&
            !successId && (
              <form
                className="lr-form"
                onSubmit={submitRequest}
              >
                <h2>
                  {isUpdate ? copy.update : copy.apply}
                </h2>

                <p className="lr-required">
                  {copy.required}
                </p>

                {mode === "invitation_only" && (
                  <div className="lr-invitation">
                    <p>{copy.invitationNotice}</p>

                    <label htmlFor="lr-invitation">
                      {copy.invitation} *
                    </label>

                    <input
                      id="lr-invitation"
                      type="password"
                      autoComplete="off"
                      required
                      minLength={64}
                      maxLength={64}
                      pattern="[a-f0-9]{64}"
                      value={form.invitation}
                      onChange={event =>
                        updateField(
                          "invitation",
                          event.target.value
                        )
                      }
                    />
                  </div>
                )}

                <fieldset
                  className="lr-fields"
                  disabled={submitting}
                >
                  <div className="lr-field">
                    <label htmlFor="lr-organisation">
                      {copy.organisation} *
                    </label>

                    <input
                      id="lr-organisation"
                      required
                      maxLength={200}
                      autoComplete="organization"
                      value={form.organisation_name}
                      onChange={event =>
                        updateField(
                          "organisation_name",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="lr-field">
                    <label htmlFor="lr-contact">
                      {copy.contact} *
                    </label>

                    <input
                      id="lr-contact"
                      required
                      maxLength={200}
                      autoComplete="name"
                      value={form.contact_name}
                      onChange={event =>
                        updateField(
                          "contact_name",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="lr-field-grid">
                    <div className="lr-field">
                      <label htmlFor="lr-email">
                        {copy.email} *
                      </label>

                      <input
                        id="lr-email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        value={form.email}
                        onChange={event =>
                          updateField(
                            "email",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="lr-field">
                      <label htmlFor="lr-phone">
                        {copy.phone}
                      </label>

                      <input
                        id="lr-phone"
                        type="tel"
                        maxLength={80}
                        autoComplete="tel"
                        value={form.phone}
                        onChange={event =>
                          updateField(
                            "phone",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {isUpdate && (
                    <div className="lr-field">
                      <label htmlFor="lr-reference">
                        {copy.reference}
                      </label>

                      <input
                        id="lr-reference"
                        maxLength={36}
                        value={form.listing_id}
                        pattern="[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}"
                        onChange={event =>
                          updateField(
                            "listing_id",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  <div className="lr-field">
                    <label htmlFor="lr-details">
                      {isUpdate
                        ? copy.updateDetails
                        : copy.applyDetails} *
                    </label>

                    <textarea
                      id="lr-details"
                      rows={6}
                      required
                      maxLength={5000}
                      placeholder={
                        isUpdate
                          ? copy.updatePlaceholder
                          : copy.applyPlaceholder
                      }
                      aria-describedby="lr-sensitive"
                      value={form.details}
                      onChange={event =>
                        updateField(
                          "details",
                          event.target.value
                        )
                      }
                    />

                    <small>
                      {form.details.length} / 5000
                    </small>

                    <small id="lr-sensitive">
                      {copy.noSensitive}
                    </small>
                  </div>

                  <label className="lr-consent">
                    <input
                      type="checkbox"
                      required
                      checked={form.consent}
                      onChange={event =>
                        updateField(
                          "consent",
                          event.target.checked
                        )
                      }
                    />

                    <span>{copy.consent}</span>
                  </label>
                </fieldset>

                <Link
                  className="lr-privacy-link"
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.privacy} ↗
                </Link>

                {error && (
                  <p className="lr-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="lr-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? copy.submitting
                    : copy.submit}
                </button>

                <p className="lr-review-note">
                  {copy.review}
                </p>
              </form>
            )}
        </div>
      </section>
    </main>
  );
}
