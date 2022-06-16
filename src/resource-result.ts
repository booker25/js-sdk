import AvailabilityTimeSlotResponse from './api/availability-reponse'
import ServiceTimeSlotResponse from './api/service-availability-response'
import Resource, { SFResource } from './s-objects/resource'
import { Condition } from './s-objects/s-object'
import { isSalesforceId } from './utils/salesforce-utils'

export default class ResourceResult {
  private readonly resourcesById: Map<string, Resource>

  constructor (sfResourcedata: SFResource[]) {
    // Map all resources to their ids
    this.resourcesById = sfResourcedata.reduce((map, sfResourcedata) => {
      const resource = new Resource(sfResourcedata)
      map.set(resource.id, resource)
      return map
    }, new Map())
  }

  public computeTreeStructure (): ResourceResult {
    // Go through all of the resources and set the parent and children fields
    this.resourcesById.forEach((resource, id, map) => {
      if (resource.parentId === null) {
        return
      }
      const parentResource = map.get(resource.parentId)
      if (parentResource === undefined) {
        return
      }
      resource.parent = parentResource
      parentResource.children.push(resource)
    })
    return this
  }

  public addAvailabilitySlotData (dimensionsSlotData: AvailabilityTimeSlotResponse[]): void {
    dimensionsSlotData.forEach((slotData) => {
      const matchingResource = this.resourcesById.get(slotData.dimensionId)
      if (matchingResource === undefined) {
        return
      }
      matchingResource.addAvailabilitySlotData(slotData)
      if (matchingResource.isClosed()) {
        this.resourcesById.delete(slotData.dimensionId)
      }
    })
  }

  public addServiceSlotData (dimensionsServiceSlotData: ServiceTimeSlotResponse[]): void {
    dimensionsServiceSlotData.forEach((slotData) => {
      const matchingResource = this.resourcesById.get(slotData.dimensionId)
      if (matchingResource === undefined) {
        return
      }
      matchingResource.addServiceData(slotData)
    })
  }

  public filterOnConditions (conditions: Condition[][]): void {
    if (conditions.length === 0) {
      return
    }
    this.resourcesById.forEach((resource) => {
      const shouldBeKept = conditions.some(conditions => conditions.every(condition => condition.matches(resource)))
      if (!shouldBeKept) {
        this.resourcesById.delete(resource.id)
      }
    })
  }

  public numberOfresources (): number {
    return this.resourcesById.size
  }

  public getResourceIds (): string[] {
    return [...this.resourcesById.keys()]
  }

  public getResource (idOrName: string): Resource | undefined {
    if (isSalesforceId(idOrName)) {
      return this.resourcesById.get(idOrName)
    }
    return [...this.resourcesById.values()].find(resource => resource.name === idOrName)
  }
}
