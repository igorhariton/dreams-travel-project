using TravelBackend.Domain.Models.PlannerTrip;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IPlannerTripAction
    {
        List<PlannerTripDto> GetAllPlannerTripsAction();
        PlannerTripDto? GetPlannerTripByIdAction(int id);
        ActionResponce CreatePlannerTripAction(PlannerTripDto data);
        ActionResponce UpdatePlannerTripAction(PlannerTripDto data);
        ActionResponce DeletePlannerTripAction(int id);
    }
}
