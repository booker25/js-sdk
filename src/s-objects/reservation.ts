import Contact from './contact'
import Lead from './lead'
import Resource from './resource'
import SObject from './s-object'

export default class Reservation extends SObject {
  private startDatetime: Date | null = null
  private endDatetime: Date | null = null
  private resource: Resource | null = null
  private contact: Contact | null = null
  private lead: Lead | null = null

  public setResource (resource: Resource): Reservation {
    this.resource = resource
    return this
  }

  public setStartDatetime (datetime: Date): Reservation {
    this.startDatetime = datetime
    return this
  }

  public setEndDatetime (datetime: Date): Reservation {
    this.endDatetime = datetime
    return this
  }

  public setContact (contact: Contact): Reservation {
    this.contact = contact
    return this
  }

  public setLead (lead: Lead): Reservation {
    this.lead = lead
    return this
  }

  // TODO any structure or property names here are subject to change
  // The endpoint has not yet been written and will have to be designed later when all requirements are more clear
  public override getRestData (): { [key: string]: any } {
    const requestData: { [key: string]: any } = {}
    requestData.reservation = this.getReservationRestData()
    requestData.leadConfig = this.getLeadConfig()
    requestData.contactConfig = this.getContactConfig()
    return requestData
  }

  private getReservationRestData (): { [key: string]: any } {
    const reservationData = super.getRestData()
    if (this.resource !== null) {
      reservationData.B25__Resource__c = this.resource.id
    }
    if (this.getStartDatetimeString() !== null) {
      reservationData.B25__Start__c = this.getStartDatetimeString()
    }
    if (this.getEndDatetimeString() !== null) {
      reservationData.B25__End__c = this.getEndDatetimeString()
    }
    return reservationData
  }

  // TODO this is a more complex object because it is anticipated that it will include info
  // On how to link the lead and potential duplicate rule use.
  private getLeadConfig (): { [key: string]: any } | null {
    if (this.lead === null) {
      return null
    }
    const leadData = this.lead.getRestData()
    return {
      lead: leadData
    }
  }

  // TODO this is a more complex object because it is anticipated that it will include info
  // On how to link the contact and potential duplicate rule use.
  private getContactConfig (): { [key: string]: any } | null {
    if (this.contact === null) {
      return null
    }
    const contactData = this.contact.getRestData()
    return {
      contact: contactData
    }
  }

  private getStartDatetimeString (): string | null {
    if (this.startDatetime === null) {
      return null
    }
    return this.startDatetime.toISOString()
  }

  private getEndDatetimeString (): string | null {
    if (this.endDatetime === null) {
      return null
    }
    return this.endDatetime.toISOString()
  }
}