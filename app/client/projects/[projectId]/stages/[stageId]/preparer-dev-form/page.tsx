"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function PreparerDevFormPage() {
  const params = useParams();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const stageId = Array.isArray(params.stageId) ? params.stageId[0] : params.stageId;
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [stage, setStage] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      const res = await fetch(`/api/projects/${projectId}`)
      const data = await res.json()
      setProject(data)
      const st = (data.stages || []).find((s: any) => s.id === Number(stageId))
      setStage(st)
      setForm(st?.preparerDevAnswers || {})
      setLoading(false)
    }
    fetchProject()
  }, [projectId, stageId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${projectId}/stages/${stageId}/preparer-dev`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSuccess(true);
      router.push("/client");
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>
  if (!project || !stage) return <div className="p-8 text-center text-red-500">Projet ou étape introuvable.</div>

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">Formulaire – Préparer le développement de votre projet</h2>
      <div className="text-xs text-gray-600 mb-4">Merci de remplir ce formulaire avec précision afin que nous anticipions les étapes clés du développement de votre projet.</div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Axeptio - Bannière de consentement */}
        <div className="space-y-2">
          <div className="font-medium text-brand-dark">Mise en place de la bannière de consentement (gestion des cookies)</div>
          <div className="text-xs text-gray-600">
            Nous utilisons la solution Axeptio.<br />
            Voici la grille tarifaire : <a href="https://www.axept.io/fr/tarifs" target="_blank" className="underline text-brand-blue">https://www.axept.io/fr/tarifs</a><br />
            L'offre gratuite est suffisante pour tout démarrage de projet.<br />
            Néanmoins, il vous faut procéder à la création du compte par vous-même car il est demandé vos informations bancaires pour pouvoir accéder à l'offre supérieure une fois le quota atteint automatiquement.<br />
            Pour ce faire, il vous suffit de cliquer sur le bouton "Démarrer gratuitement".<br />
            Nous pouvons le faire ensemble si vous le souhaitez.
          </div>
          <label className="block mt-2">Voulez-vous qu'on crée le compte Axeptio ensemble ?</label>
          <div className="flex gap-4">
            <label><input type="radio" name="rdvAxeptio" value="oui" checked={form.rdvAxeptio === "oui"} onChange={handleChange} /> Oui</label>
            <label><input type="radio" name="rdvAxeptio" value="non" checked={form.rdvAxeptio === "non"} onChange={handleChange} /> Non</label>
          </div>
          {form.rdvAxeptio === "oui" && (
            <div className="mt-2">
              <label className="block mb-1">Quelles sont vos disponibilités ? (sélectionnez une date)</label>
              <input type="date" name="dateAxeptio" value={form.dateAxeptio || ''} onChange={handleChange} className="input" />
            </div>
          )}
          {form.rdvAxeptio === "non" && (
            <div className="mt-2">
              <label className="block mb-1">Merci de m'envoyer l'ID du consentement Axeptio afin de relier le site à la solution :</label>
              <input type="text" name="idAxeptio" value={form.idAxeptio || ''} onChange={handleChange} className="input" />
            </div>
          )}
          <div className="mt-2">
            <label className="block mb-1">Commentaires :</label>
            <textarea name="commentAxeptio" value={form.commentAxeptio || ''} onChange={handleChange} className="input w-full" />
          </div>
        </div>
        {/* Google Map & Recaptcha */}
        <div className="space-y-2">
          <div className="font-medium text-brand-dark">Installer le recaptcha + Google Map sur le site</div>
          <label className="block">Avez-vous un compte Google pour la société ?</label>
          <div className="flex gap-4">
            <label><input type="radio" name="hasGoogleAccount" value="oui" checked={form.hasGoogleAccount === "oui"} onChange={handleChange} /> Oui</label>
            <label><input type="radio" name="hasGoogleAccount" value="non" checked={form.hasGoogleAccount === "non"} onChange={handleChange} /> Non</label>
          </div>
          {form.hasGoogleAccount === "oui" && (
            <div className="mt-2">
              <label className="block mb-1">Indiquez votre clé Google Map ici :</label>
              <input type="text" name="googleMapKey" value={form.googleMapKey || ''} onChange={handleChange} className="input" />
            </div>
          )}
          {form.hasGoogleAccount === "non" && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-gray-600">Installer Google Map<br />Pour récupérer la clé d'API de Google Maps Embed API (service gratuit de Google qui permet d'intégrer Google Maps dans votre site) : <a href="https://developers.google.com/maps/documentation/embed/get-api-key" target="_blank" className="underline text-brand-blue">Utilisation des clés de l'API</a>.</div>
              <div className="text-xs text-gray-600">Installer recaptcha<br />Voici les informations pour récupérer les clés : <a href="https://www.google.com/recaptcha/about/" target="_blank" className="underline text-brand-blue">https://www.google.com/recaptcha/about/</a></div>
              <label className="block mb-1">Clé du site :</label>
              <input type="text" name="recaptchaSiteKey" value={form.recaptchaSiteKey || ''} onChange={handleChange} className="input" />
              <label className="block mb-1">Clé secrète :</label>
              <input type="text" name="recaptchaSecretKey" value={form.recaptchaSecretKey || ''} onChange={handleChange} className="input" />
            </div>
          )}
        </div>
        {/* BREVO (Sendinblue) */}
        <div className="space-y-2">
          <div className="font-medium text-brand-dark">Mise en place de l'envoi d'emails via BREVO (ex-Sendinblue)</div>
          <div className="text-xs text-gray-600">
            Nous utilisons la solution BREVO pour gérer l'envoi des formulaires de contact, newsletters et inscriptions via un serveur SMTP fiable.<br />
            Lien vers le site : <a href="https://www.brevo.com/fr/" target="_blank" className="underline text-brand-blue">https://www.brevo.com/fr/</a><br />
            L'offre gratuite suffit pour démarrer.
          </div>
          <div className="mt-2 font-medium">1. Création du compte Brevo</div>
          <div className="mb-2">Vous avez deux options :</div>
          <div className="flex flex-col gap-2">
            <label><input type="radio" name="brevoOption" value="nous" checked={form.brevoOption === "nous"} onChange={handleChange} /> Nous gérons tout pour vous (merci de nous transmettre temporairement vos identifiants de connexion ou nous demander de créer un compte à votre place)</label>
            <label><input type="radio" name="brevoOption" value="vous" checked={form.brevoOption === "vous"} onChange={handleChange} /> Vous créez le compte vous-même</label>
          </div>
          {form.brevoOption === "vous" && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-gray-600">Allez sur <a href="https://www.brevo.com/fr/" target="_blank" className="underline text-brand-blue">https://www.brevo.com/fr/</a>, cliquez sur « S'inscrire gratuitement », suivez les étapes de création du compte (email + mot de passe). Une fois le compte créé, merci de :<br />- Valider votre adresse email<br />- Vérifier le domaine à utiliser pour l'envoi d'emails (ex : contact@votresite.fr)<br />- Nous transmettre la clé SMTP et la clé API nécessaires à l'intégration technique.</div>
            </div>
          )}
          <div className="mt-2 font-medium">Souhaitez-vous prendre un rendez-vous pour cela ?</div>
          <div className="flex gap-4">
            <label><input type="radio" name="rdvBrevo" value="oui" checked={form.rdvBrevo === "oui"} onChange={handleChange} /> Oui</label>
            <label><input type="radio" name="rdvBrevo" value="non" checked={form.rdvBrevo === "non"} onChange={handleChange} /> Non</label>
          </div>
          {form.rdvBrevo === "oui" && (
            <div className="mt-2">
              <label className="block mb-1">Sélectionnez une date pour un rendez-vous :</label>
              <input type="date" name="dateBrevo" value={form.dateBrevo || ''} onChange={handleChange} className="input" />
            </div>
          )}
          <div className="mt-2 font-medium">2. Informations à nous transmettre si vous gérez le compte vous-même</div>
          <div className="space-y-2">
            <label className="block mb-1">Clé SMTP :</label>
            <input type="text" name="smtpKey" value={form.smtpKey || ''} onChange={handleChange} className="input" />
            <label className="block mb-1">Clé API (v3) :</label>
            <input type="text" name="apiKey" value={form.apiKey || ''} onChange={handleChange} className="input" />
            <label className="block mb-1">Email d'envoi validé :</label>
            <input type="text" name="emailSender" value={form.emailSender || ''} onChange={handleChange} className="input" />
            <label className="block mb-1">Nom de domaine vérifié (correspondant à l'email d'envoi) :</label>
            <input type="text" name="domain" value={form.domain || ''} onChange={handleChange} className="input" />
          </div>
        </div>
        <Button type="submit" className="w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark" disabled={submitting}>
          {submitting ? "Envoi en cours..." : "Envoyer le formulaire"}
        </Button>
        {success && <div className="text-green-600 text-sm mt-2">Formulaire envoyé avec succès ! Redirection...</div>}
      </form>
    </div>
  )
} 