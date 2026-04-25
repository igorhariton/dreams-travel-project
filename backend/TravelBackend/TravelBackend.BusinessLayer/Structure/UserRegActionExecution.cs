using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Responces;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.BusinessLayer.Structure
{
    public class UserRegActionExecution : UserActions, IUserRegAction
    {
        public ActionResponce UserRegDataValidation(UserRegisterDto uReg)
        {
            return UserRegDataValidationAction(uReg);
        }
    }
}
