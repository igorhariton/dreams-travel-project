using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.PlannerTrip;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Structure
{
    public class PlannerTripActionExecution : PlannerTripActions, IPlannerTripAction
    {
        public ActionResponce CreatePlannerTripAction(PlannerTripDto data)
        {
            return CreatePlannerTripActionExecution(data);
        }

        public ActionResponce DeletePlannerTripAction(int id)
        {
            return DeletePlannerTripActionExecution(id);
        }

        public List<PlannerTripDto> GetAllPlannerTripsAction()
        {
            return GetAllPlannerTripsActionExecution();
        }

        public PlannerTripDto? GetPlannerTripByIdAction(int id)
        {
            return GetPlannerTripByIdActionExecution(id);
        }

        public ActionResponce UpdatePlannerTripAction(PlannerTripDto data)
        {
            return UpdatePlannerTripActionExecution(data);
        }
    }
}
