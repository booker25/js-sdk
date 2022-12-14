import Booker25API from './api/booker25-api-requests'
import ResourceRequest from './resource-request'
import Contact from './s-objects/contact'
import Lead from './s-objects/lead'
import Reservation from './s-objects/reservation'
import ServiceReservation, { SFServiceReservation } from './s-objects/service-reservation'

enum Environment {
  DEVELOP,
  ACCEPTANCE,
  STAGING,
  PRODUCTION,
}

/**
 * Booker25 object allows for interaction with booker25
 */
class Booker25 {
  static version: string = '0.0.5'
  private readonly environment: Environment
  private readonly api: Booker25API

  /**
   * @param apiKey - The api key generated from the booker25 general settings page.
   * @param environment - What environment to connect to. Default: Environment.PRODUCTION
   */
  constructor (apiKey: string, environment: Environment = Environment.PRODUCTION) {
    this.environment = environment
    this.api = new Booker25API(apiKey, environment)
  }

  /**
   * Creates a new request for resources. The request can then be specified using methods on the resource request.
   *
   * @returns new resource request using the authentication from this Booker25 instance
   */
  public buildResourceRequest (): ResourceRequest {
    return new ResourceRequest(this.api)
  }

  /**
   * Saves a reservation object to salesforce. With the contact, lead, and service reservations added to it.
   * Behaviour and allowed opperations can be changed through settings on the salesforce org.
   *
   * @param reservation The reservation object to save
   * @returns The saved reservation object with any new values populated by the save in salesforce.
   */
  public async saveReservation (reservation: Reservation): Promise<Reservation> {
    const result = await this.api.saveReservation(reservation.getReservationSaveRequest()) as any
    const outputReservation = new Reservation()
    outputReservation.id = result.reservation.Id
    outputReservation.setStartDatetime(new Date(result.reservation.B25__Start__c))
    outputReservation.setEndDatetime(new Date(result.reservation.B25__End__c))
    const resource = reservation.getResource()
    if (resource !== null) {
      outputReservation.setResource(resource)
    }
    Object.entries(result.reservation).forEach(([fieldName, fieldValue]) => {
      outputReservation.setCustomProperty(fieldName, fieldValue)
    })
    if (result.contact !== null) {
      const contact = new Contact('', '', '') // Note these values are custom properties and will be overriden
      Object.entries(result.contact).forEach(([fieldName, fieldValue]) => {
        contact.setCustomProperty(fieldName, fieldValue)
      })
      outputReservation.setContact(contact)
    }
    if (result.lead !== null) {
      const lead = new Lead('', '', '') // Note these values are custom properties and will be overriden
      Object.entries(result.lead).forEach(([fieldName, fieldValue]) => {
        lead.setCustomProperty(fieldName, fieldValue)
      })
      outputReservation.setLead(lead)
    }
    if (result.serviceReservations !== null) {
      const serviceReservations = result.serviceReservations.map((serviceReservation: SFServiceReservation) => {
        const matchingService = reservation.serviceReservations.find(
          (originalServiceReservation) => {
            return originalServiceReservation.service.id === serviceReservation.B25__Service__c
          }
        )
        if (matchingService !== undefined) {
          const newServiceReservation = new ServiceReservation(matchingService.service, serviceReservation.B25__Quantity__c ?? 0)
          Object.entries(serviceReservation).forEach(([fieldName, fieldValue]) => {
            newServiceReservation.setCustomProperty(fieldName, fieldValue)
          })
          return newServiceReservation
        }
        return null
      }).filter((serviceReservation: any) => serviceReservation !== null)
      outputReservation.serviceReservations = serviceReservations
    }
    return outputReservation
  }

  /**
   * Sends the reservation object to salesforce to have the price calculations run.
   * The calculated price is then populated on the reservation returned.
   *
   * @param reservation The reservation to calculate the price for.
   * @returns The reservation with updated price fields.
   */
  public async calculatePrice (reservation: Reservation): Promise<Reservation> {
    const updatedPriceCalculationData = await this.api.calculatePrice(reservation.getPriceCalculationData())
    Object.entries(updatedPriceCalculationData.reservation).forEach(([fieldName, value]) => reservation.setCustomProperty(fieldName, value))
    updatedPriceCalculationData.serviceReservations.forEach((serviceReservationData: Partial<SFServiceReservation>, index: number) => {
      Object.entries(serviceReservationData).forEach(([fieldName, value]) => reservation.serviceReservations[index].setCustomProperty(fieldName, value))
    })
    const serviceCosts = reservation.serviceReservations.reduce((serviceCosts, serviceReservation) => {
      const quantity = serviceReservation.getCustomProperty('B25__Quantity__c') ?? 0
      const unitPrice = serviceReservation.getCustomProperty('B25__Unit_Price__c') ?? 0
      const vatRate = serviceReservation.getCustomProperty('B25LP__VAT_Rate__c') ?? 0
      serviceReservation.quantity = quantity
      serviceReservation.unitPrice = unitPrice
      const subtotal = quantity * unitPrice
      const subtotalIncl = subtotal + (subtotal * vatRate)
      serviceReservation.setCustomProperty('B25__Subtotal__c', subtotal)
      serviceReservation.setCustomProperty('B25LP__Subtotal_Incl__c', subtotalIncl)
      serviceCosts.serviceCosts = serviceCosts.serviceCosts + subtotal
      serviceCosts.serviceCostsIncl = serviceCosts.serviceCostsIncl + subtotalIncl
      return serviceCosts
    }, { serviceCosts: 0, serviceCostsIncl: 0 })
    reservation.setCustomProperty('B25__Service_Costs__c', serviceCosts.serviceCosts)
    reservation.setCustomProperty('B25LP__Service_Costs_Incl__c', serviceCosts.serviceCostsIncl)
    const priceFieldValue = reservation.getCustomProperty('B25__Price__c')
    const subtotalValue = (reservation.getCustomProperty('B25__Subtotal__c') ?? 0) as number
    const vatRate = (reservation.getCustomProperty('B25LP__VAT_Rate__c') ?? 0) as number
    const subtotalIncl = subtotalValue + (subtotalValue * vatRate)
    reservation.setCustomProperty('B25LP__Subtotal_Incl__c', subtotalIncl)
    reservation.setCustomProperty('B25LP__Total_Incl__c', serviceCosts.serviceCostsIncl + subtotalIncl)
    reservation.setCustomProperty('B25__Total_Price__c', priceFieldValue ?? (subtotalValue + serviceCosts.serviceCosts))
    return reservation
  }
}
export {
  Environment
}
export default Booker25
